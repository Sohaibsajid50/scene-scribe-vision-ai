import httpx
import uuid
import json
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.api import dependencies
from app.models import db_models, api_models
from app.crud import job_crud
from app.services.history_service import history_service
from app.agents.adk_agent import upload_to_gemini
from app.core.config import settings
from app.services.s3_service import s3_service # New import

router = APIRouter(prefix="/api/chat", tags=["Chat"])

async def create_adk_session(session_id: str, current_user: str) -> bool:
    """
    Creates a session on the external ADK service.
    Returns True on success, False on failure.
    """
    adk_session_url = f"{settings.ADK_API_URL}/apps/{settings.APP_NAME}/users/{current_user}/sessions/{session_id}"
    try:
        print(f"Attempting to create ADK session at: {adk_session_url}")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                adk_session_url,
                headers={"Content-Type": "application/json"},
                data=json.dumps({}),
                timeout=120.0
            )
            response.raise_for_status() 
            print(f"Successfully created ADK session for user {current_user}, session {session_id}")
            return True
    except httpx.HTTPStatusError as e:
        print(f"Failed to create ADK session. HTTP Status: {e.response.status_code}, Response: {e.response.text}")
        return False
    except httpx.RequestError as e:
        print(f"Failed to create ADK session due to network error: {e}")
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
    display_video_url = None # New variable
    title = message[:50]
    
    # Combine message and context for the first turn
    first_turn_message = message
    youtube_url_pattern = re.compile(r'(https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)[^\s]+)')
    url_match = youtube_url_pattern.search(message)

    if file:
        job_type = db_models.JobType.VIDEO
        # Read file content for S3 upload
        file_content = await file.read()
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload to S3
        display_video_url = await s3_service.upload_file(file_content, unique_filename, file.content_type)

        # Rewind file pointer for Gemini upload
        await file.seek(0)

        # Upload to Gemini (if needed)
        gemini_file = await upload_to_gemini(file)
        gemini_file_id = gemini_file.name
        title = file.filename
        
    elif url_match:
        job_type = db_models.JobType.YOUTUBE
        source_url = url_match.group(1)
        display_video_url = source_url # Store YouTube URL for display
        first_turn_message += f"\n\nYouTube URL: {source_url}"

    job = job_crud.create_job(
        db=db, user_id=current_user.id, job_type=job_type, prompt=message,
        title=title, gemini_file_id=gemini_file_id, source_url=source_url,
        display_video_url=display_video_url, # Pass the new URL
        current_agent="ADK"
    )
    session_id = str(job.id)

    # Set job status to PROCESSING immediately after creation
    job_crud.update_job_status(db, job_id=job.id, user_id=current_user.id, status=db_models.JobStatus.PROCESSING)

    # Await and check the result of session creation
    session_created = await create_adk_session(session_id, str(current_user.id))
    
    if not session_created:
        job_crud.update_job_status(db, job_id=job.id, user_id=current_user.id, status=db_models.JobStatus.ERROR, error_message="Failed to create ADK session.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to create a session with the analysis service. Please try again later."
        )

    # Proceed to send the first message
    chat_response = await continue_chat(
        job_id=job.id,
        db=db,
        current_user=current_user,
        message=first_turn_message,  # Pass the combined message
        gemini_file_id=gemini_file_id,
        source_url=source_url
    )
    
    # After continue_chat, the status should be updated by continue_chat itself.
    # We just return the response.
    return chat_response



@router.post("/{job_id}", response_model=api_models.ChatResponse)
async def continue_chat(
    job_id: uuid.UUID,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
    message: str = Form(...),
    gemini_file_id: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
):
    """

    Continues an existing conversation by sending a message to the ADK service.
    """
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")

    session_id = str(job.id)
    adk_url = f"{settings.ADK_API_URL}/run"

    try:
        async with httpx.AsyncClient() as client:
            request_data = {
                "app_name": settings.APP_NAME,
                "user_id": str(current_user.id),
                "session_id": session_id,
                "new_message":{
                    "role": "user",
                    "parts": [
                        {"text": message + (f"\n\nGemini File ID: {gemini_file_id}" if gemini_file_id else "") + (f"\n\nYouTube URL: {source_url}" if source_url else "")}
                    ]
                }
            }
            print(f"Sending request to ADK /run: URL={settings.ADK_API_URL}/run, Data={json.dumps(request_data)}")
            response = await client.post(
                f"{settings.ADK_API_URL}/run",
                headers={"Content-Type": "application/json"},
                data=json.dumps(request_data),
                timeout=300.0
            )
            response.raise_for_status()
            adk_result = response.json()
            print(f"Received response from ADK /run: Status={response.status_code}, Response={response.text}")

        assistant_message = ""  # Initialize to an empty string
        for event in adk_result:
            if event.get("content", {}).get("role") == "model" and "text" in event.get("content", {}).get("parts", [{}])[0]:
                assistant_message = event["content"]["parts"][0]["text"]

        history_service.add_message_to_history(db, session_id, "USER", message)
        history_service.add_message_to_history(db, session_id, "ASSISTANT", assistant_message)
        job_crud.update_job_status(db, job_id=job_id, user_id=current_user.id, status=db_models.JobStatus.ACTIVE)

        return {"response": assistant_message, "conversation_id": session_id, "display_video_url": job.display_video_url}

    except httpx.RequestError as e:
        job_crud.update_job_status(db, job_id=job_id, user_id=current_user.id, status=db_models.JobStatus.ERROR, error_message=f"ADK service unavailable: {e}")
        raise HTTPException(status_code=503, detail=f"ADK service unavailable: {e}")
    except Exception as e:
        job_crud.update_job_status(db, job_id=job_id, user_id=current_user.id, status=db_models.JobStatus.ERROR, error_message=f"Error communicating with ADK service: {e}")
        raise HTTPException(status_code=500, detail=f"Error communicating with ADK service: {e}")

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
    """Gets the full chat history for a specific job, checking Redis first, then the database."""
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if job.messages:
        return job.messages

    # If no history in DB, return empty list.
    return []

@router.get("/job/{job_id}", response_model=api_models.Job)
def get_job_details(
    job_id: uuid.UUID,
    db: Session = Depends(dependencies.get_db),
    current_user: db_models.User = Depends(dependencies.get_current_user),
):
    """Gets the details of a single job."""
    job = job_crud.get_job(db, job_id=job_id, user_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job