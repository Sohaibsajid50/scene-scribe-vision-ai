import httpx
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.api import dependencies
from app.models import db_models, api_models
from app.crud import job_crud
from app.services.history_service import history_service
from app.agents.adk_agent import upload_to_gemini
from app.core.config import settings
from langchain_core.messages import HumanMessage

router = APIRouter(prefix="/api/chat", tags=["Chat"])

async def create_adk_session(session_id: str, current_user: str) -> bool:
    """
    Creates a session on the external ADK service.
    Returns True on success, False on failure.
    """
    adk_session_url = f"{settings.ADK_API_URL}/apps/{settings.APP_NAME}/users/{current_user}/sessions/{session_id}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                adk_session_url,
                headers={"Content-Type": "application/json"},
                data=json.dumps({}),
                timeout=60.0
            )
            response.raise_for_status()  # Will raise an exception for 4xx/5xx responses
            return True
    except httpx.HTTPStatusError as e:
        # Log the error for debugging
        print(f"Failed to create ADK session. Status: {e.response.status_code}, Response: {e.response.text}")
        return False
    except httpx.RequestError:
        # Network-level error
        return False


@router.post("/start", response_model=api_models.ChatResponse)
async def start_chat(
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    """
    Starts a new conversation.
    1. Creates a Job in the local DB.
    2. Creates a session on the ADK service.
    3. Sends the first message to the ADK service.
    """
    job_type = db_models.JobType.TEXT
    gemini_file_id = None
    source_url = None
    title = message[:50]
    
    # Combine message and context for the first turn
    first_turn_message = message
    if file:
        job_type = db_models.JobType.VIDEO
        gemini_file = await upload_to_gemini(file)
        gemini_file_id = gemini_file.name
        title = file.filename
        first_turn_message += f"\n\nFile ID: {gemini_file_id}"
    elif "youtube.com" in message or "youtu.be" in message:
        job_type = db_models.JobType.YOUTUBE
        source_url = message
        first_turn_message += f"\n\nYouTube URL: {source_url}"

    job = job_crud.create_job(
        db=db, user_id=current_user.id, job_type=job_type, prompt=message,
        title=title, gemini_file_id=gemini_file_id, source_url=source_url,
        current_agent="ADK"
    )
    session_id = str(job.id)

    # Await and check the result of session creation
    session_created = await create_adk_session(session_id, str(current_user.id))
    
    if not session_created:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to create a session with the analysis service. Please try again later."
        )

    # Proceed to send the first message
    return await continue_chat(
        job_id=job.id,
        db=db,
        current_user=current_user,
        message=first_turn_message  # Pass the combined message
    )



@router.post("/{job_id}", response_model=api_models.ChatResponse)
async def continue_chat(
    job_id: uuid.UUID,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
    message: str = Form(...),
):
    """

    Continues an existing conversation by sending a message to the ADK service.
    """
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")

    session_id = str(job.id)
    adk_url = f"{settings.ADK_API_URL}/invoke"
    payload = {
        "input": {"messages": [HumanMessage(content=message).dict()]},
        "config": {"configurable": {"session_id": session_id}}
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(adk_url, json=payload, timeout=300.0)
            response.raise_for_status()
            adk_result = response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"ADK service unavailable: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with ADK service: {e}")

    try:
        response_content = adk_result['output']['messages'][-1]['content']
    except (KeyError, IndexError, TypeError):
        response_content = "Error parsing ADK response."

    history_service.add_message_to_history(session_id, "USER", message)
    history_service.add_message_to_history(session_id, "ASSISTANT", response_content)

    return {"response": response_content, "conversation_id": session_id}

@router.get("/history", response_model=List[api_models.Job])
def get_history(
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
):
    """Gets the list of all jobs (conversations) for the current user."""
    return job_crud.get_jobs_by_user(db, user_id=current_user.id)


@router.get("/history/{job_id}", response_model=List[api_models.Message])
def get_chat_history(
    job_id: uuid.UUID,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
):
    """Gets the full persisted chat history for a specific job."""
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return job.messages