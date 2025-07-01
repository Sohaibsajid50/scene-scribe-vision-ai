from typing import List
from sqlalchemy.orm import Session
import uuid
from app.models import db_models

def create_job(db: Session, user_id: int, job_type: db_models.JobType, prompt: str, title: str, gemini_file_id: str = None, source_url: str = None, current_agent: str = None) -> db_models.Job:
    """
    Creates a new job record in the database.
    """
    db_job = db_models.Job(
        user_id=user_id, 
        job_type=job_type,
        prompt=prompt,
        title=title,
        gemini_file_id=gemini_file_id,
        source_url=source_url,
        current_agent=current_agent
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_job(db: Session, job_id: uuid.UUID, user_id: int) -> db_models.Job:
    """
    Fetches a job by its ID, ensuring it belongs to the correct user.
    """
    print(f"Attempting to fetch job with ID: {job_id} for user ID: {user_id}")
    job = db.query(db_models.Job).filter(db_models.Job.id == job_id, db_models.Job.user_id == user_id).first()
    if job:
        print(f"Found job: {job.id} for user: {job.user_id}")
    else:
        print(f"Job with ID: {job_id} not found for user ID: {user_id}")
    return job

def get_jobs_by_user(db: Session, user_id: int) -> List[db_models.Job]:
    """
    Fetches all jobs for a specific user.
    """
    return db.query(db_models.Job).filter(db_models.Job.user_id == user_id).order_by(db_models.Job.created_at.desc()).all()

def update_job_status(db: Session, job_id: uuid.UUID, user_id: int, status: db_models.JobStatus, result: str = None, error_message: str = None):
    """
    Updates the status and result of a job, ensuring it belongs to the correct user.
    """
    db_job = db.query(db_models.Job).filter(db_models.Job.id == job_id, db_models.Job.user_id == user_id).first()
    if db_job:
        db_job.status = status
        if result:
            db_job.result = result
        if error_message:
            db_job.error_message = error_message
        db.commit()
        db.refresh(db_job)
    return db_job

def update_job_agent(db: Session, job_id: uuid.UUID, user_id: int, agent_name: str):
    """
    Updates the current agent of a job, ensuring it belongs to the correct user.
    """
    db_job = db.query(db_models.Job).filter(db_models.Job.id == job_id, db_models.Job.user_id == user_id).first()
    if db_job:
        db_job.current_agent = agent_name
        db.commit()
        db.refresh(db_job)
    return db_job
