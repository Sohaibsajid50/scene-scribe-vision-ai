import json
from typing import List, Dict
from app.core.redis_client import redis_client
from app.crud import job_crud
from app.models import db_models
from sqlalchemy.orm import Session
import uuid

class HistoryService:
    def __init__(self, client):
        self.client = client

    def add_message_to_history(self, conversation_id: str, sender: str, message: str):
        """
        Appends a new message to the conversation history in Redis.
        """
        key = f"chat_history:{conversation_id}"
        new_message = {"sender": sender, "content": message}
        self.client.rpush(key, json.dumps(new_message))

    def get_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """Retrieves the current chat history for a job from Redis."""
        return self.client.get_history(conversation_id)

    def persist_chat_history(self, db: Session, job_id: uuid.UUID, user_id: int):
        """
        Moves the chat history from Redis to the PostgreSQL database.
        """
        conversation_id = str(job_id)
        history = self.get_history(conversation_id)
        
        job = job_crud.get_job(db, job_id=job_id, user_id=user_id)
        if not job:
            return

        for msg in history:
            db_message = db_models.ChatMessage(
                job_id=job.id,
                sender=msg["sender"],
                content=msg["content"]
            )
            db.add(db_message)
        
        db.commit()
        
        self.client.delete_history(conversation_id)

history_service = HistoryService(redis_client)