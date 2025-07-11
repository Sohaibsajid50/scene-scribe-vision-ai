from sqlalchemy.orm import Session
import uuid
from app.crud import job_crud
from app.models.db_models import JobStatus
from app.db.session import SessionLocal
from app.agents.adk_agent import adk_app, video_agent, youtube_agent
from app.services.history_service import history_service
from langchain_core.messages import HumanMessage

async def process_job(job_id: uuid.UUID, user_id: int):
    """
    This is the main background task. It fetches the current state of the job,
    runs the adk_agent workflow, and updates the job state.
    """
    db = SessionLocal()
    try:
        print(f"[process_job] Starting for job ID: {job_id}, user ID: {user_id}")
        job = job_crud.get_job(db, job_id=job_id, user_id=user_id)
        if not job:
            print(f"[process_job] Job {job_id} not found.")
            return
        
        if job.status not in [JobStatus.PENDING, JobStatus.ACTIVE]:
            print(f"[process_job] Job {job_id} not in a processable state. Status: {job.status}")
            return

        job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.PROCESSING)
        print(f"[process_job] Job {job_id} status updated to PROCESSING.")

        history = history_service.get_history(str(job.id))
        last_user_message = ""
        if history:
            last_user_message = history[-1].get("content", "")

        # Combine the user's message with the file information
        file_info = job.gemini_file_id or job.source_url
        combined_message = f"{last_user_message}\n\nFile: {file_info}"

        # Always invoke the adk_app (Planner Agent) for routing and processing
        print(f"[process_job] Invoking adk_app for job {job_id}.")
        result = adk_app.invoke({
            "messages": [HumanMessage(content=combined_message)]
        })

        # Determine which agent was used and save it, or update if re-routed
        if isinstance(result, dict) and "messages" in result:
            for message in result["messages"]:
                if hasattr(message, 'name') and message.name in ["video_agent", "youtube_agent"]:
                    job_crud.update_job_agent(db, job_id=job_id, user_id=user_id, agent_name=message.name)
                    print(f"[process_job] Job {job_id} assigned/re-assigned to agent: {message.name}")
                    break
        
        print(f"[process_job] Agent run complete. Result: {result}")

        # Extract the relevant response content
        response_content = ""
        if isinstance(result, dict) and "messages" in result:
            for message in reversed(result["messages"]):
                if hasattr(message, 'content') and message.content.strip():
                    response_content = message.content
                    break
        
        job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.ACTIVE)
        history_service.add_message_to_history(str(job.id), "AI", response_content)
        history_service.persist_chat_history(db, job_id=job.id, user_id=user_id)
        print(f"[process_job] Job {job_id} status updated to ACTIVE. AI message added to history and persisted.")

    except Exception as e:
        print(f"[process_job] Error processing job {job_id}: {e}")
        job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.ERROR, error_message=str(e))
    finally:
        db.close()
        print(f"[process_job] DB session closed for job ID: {job_id}")