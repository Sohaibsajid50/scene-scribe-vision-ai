from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import dependencies
from app.models import db_models, api_models
from app.crud import job_crud
from app.services.history_service import history_service
from app.agents.adk_agent import upload_to_gemini
from app.services import background_tasks as bg_tasks
import uuid

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/chat", response_model=api_models.ChatResponse)
async def start_new_chat(
    background_tasks: BackgroundTasks,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    """
    Starts a new conversation. This can be with a text prompt, a YouTube URL in the
    message, or an uploaded video file.
    """
    job_type = db_models.JobType.TEXT
    gemini_file_id = None
    source_url = None
    title = message[:50] # Default title

    if file:
        job_type = db_models.JobType.VIDEO
        gemini_file = await upload_to_gemini(file)
        gemini_file_id = gemini_file.name
        title = file.filename
    elif "youtube.com" in message or "youtu.be" in message:
        job_type = db_models.JobType.YOUTUBE
        source_url = message # The agent will parse this

    # Create the job in the database
    job = job_crud.create_job(
        db=db, 
        user_id=current_user.id, 
        job_type=job_type,
        prompt=message,
        title=title,
        gemini_file_id=gemini_file_id,
        source_url=source_url,
        current_agent="Planner Agent"
    )

    # Log the first message to Redis
    history_service.add_message_to_history(str(job.id), "USER", message)

    # Trigger the agent in the background
    background_tasks.add_task(bg_tasks.process_job, job_id=job.id, user_id=current_user.id)

    return {"response": "Your request is being processed.", "conversation_id": job.id}


@router.post("/chat/{job_id}", response_model=api_models.ChatResponse)
async def continue_chat(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    """
    Continues an existing conversation.
    """
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Scope violation check
    if (job.gemini_file_id or job.source_url) and (file or "youtube.com" in message or "youtu.be" in message):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You’re already working on one video or URL. Please start a new conversation to process a different one."
        )

    # Log the user's message
    history_service.add_message_to_history(str(job.id), "USER", message)
    
    # Set the job status back to pending to trigger the agent
    job_crud.update_job_status(db, job_id=job.id, user_id=current_user.id, status=db_models.JobStatus.PENDING)

    # Trigger the agent in the background
    background_tasks.add_task(bg_tasks.process_job, job_id=job.id, user_id=current_user.id)
    
    return {"response": "Your message is being processed.", "conversation_id": job.id}


@router.get("/history", response_model=List[api_models.Job])
def get_history(
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
):
    """
    Gets the list of all jobs (conversations) for the current user.
    """
    return job_crud.get_jobs_by_user(db, user_id=current_user.id)


@router.get("/history/{job_id}", response_model=List[api_models.Message])
def get_chat_history(
    job_id: uuid.UUID,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
):
    """
    Gets the full persisted chat history for a specific job.
    """
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return job.messages