from sqlalchemy.orm import Session
import uuid
from app.crud import job_crud
from app.models.db_models import JobStatus, JobType
from app.db.session import SessionLocal
from app.agents.orchestration import planner_agent, video_agent, youtube_agent, PlannerAgentContext, YoutubeAgentContext, VideoAgentContext
from app.services.history_service import history_service
from agents import Runner

def get_agent_by_name(agent_name: str):
    if agent_name == "Planner Agent":
        return planner_agent
    elif agent_name == "Video Agent":
        return video_agent
    elif agent_name == "Youtube Agent":
        return youtube_agent
    else:
        raise ValueError(f"Unknown agent: {agent_name}")

async def process_job(job_id: uuid.UUID, user_id: int):
    """
    This is the main background task. It fetches the current state of the job,
    runs the appropriate agent, and handles the handoff.
    """
    db = SessionLocal()
    try:
        print(f"[process_job] Starting for job ID: {job_id}, user ID: {user_id}")
        job = job_crud.get_job(db, job_id=job_id, user_id=user_id)
        if not job or job.status != JobStatus.PENDING:
            print(f"[process_job] Job {job_id} not found or not PENDING. Status: {job.status if job else 'N/A'}")
            return

        job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.PROCESSING)
        print(f"[process_job] Job {job_id} status updated to PROCESSING.")

        # Get the current agent and conversation history
        agent_to_run = get_agent_by_name(job.current_agent)
        print(f"[process_job] Running agent: {job.current_agent}")
        history = history_service.get_history(str(job.id))
        
        # Construct the full context data, to be filtered for specific agent contexts
        full_context_data = {
            "conversation_id": str(job.id),
            "file_id": job.gemini_file_id or job.source_url,
            "messages": [msg["content"] for msg in history],
            "youtube_url": job.source_url,
            "prompt": job.prompt,
            "current_agent": job.current_agent,
        }

        # Instantiate the correct context model based on the current agent
        if job.current_agent == "Planner Agent":
            planner_context_data = {
                "conversation_id": full_context_data["conversation_id"],
                "file_id": full_context_data["file_id"],
                "messages": full_context_data["messages"],
                "current_agent": full_context_data["current_agent"],
            }
            agent_context = PlannerAgentContext(**planner_context_data)
        elif job.current_agent == "Youtube Agent":
            agent_context = YoutubeAgentContext(**full_context_data)
        elif job.current_agent == "Video Agent":
            agent_context = VideoAgentContext(**full_context_data)
        else:
            raise ValueError(f"Unknown agent for context creation: {job.current_agent}")

        print(f"[process_job] Agent context: {agent_context}")

        # Run the agent
        result = await Runner.run(agent_to_run, history[-1]["content"], context=agent_context)
        print(f"[process_job] Agent run complete. Result: {result.final_output}")
        
        # Handle the result and handoff
        if result.handoff_context and job.current_agent == "Planner Agent":
            next_agent_name = result.handoff_context.agent_name
            job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.ACTIVE, current_agent=next_agent_name) # Set to ACTIVE
            history_service.add_message_to_history(str(job.id), "AI", result.final_output)
            history_service.persist_chat_history(db, job_id=job.id, user_id=user_id) # Persist immediately
            print(f"[process_job] Planner Agent handed off to {next_agent_name}. Job status set to ACTIVE. AI message added to history and persisted.")
        elif result.handoff_context: # This case handles sub-agents handing off, if ever needed
            next_agent_name = result.handoff_context.agent_name
            job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.PENDING, current_agent=next_agent_name)
            history_service.add_message_to_history(str(job.id), "AI", result.final_output)
            print(f"[process_job] Handoff to {next_agent_name}. AI message added to history.")
        else: # No handoff, agent completed its task
            job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.ACTIVE)
            history_service.add_message_to_history(str(job.id), "AI", result.final_output)
            history_service.persist_chat_history(db, job_id=job.id, user_id=user_id)
            print(f"[process_job] Job {job_id} status updated to ACTIVE. AI message added to history and persisted.")

    except Exception as e:
        print(f"[process_job] Error processing job {job_id}: {e}")
        job_crud.update_job_status(db, job_id=job_id, user_id=user_id, status=JobStatus.ERROR, error_message=str(e))
    finally:
        db.close()
        print(f"[process_job] DB session closed for job ID: {job_id}")