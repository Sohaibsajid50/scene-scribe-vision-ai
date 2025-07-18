import json
from typing import List, Dict
from app.core.redis_client import redis_client
from app.crud import job_crud
from app.models import db_models
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

class HistoryService:
    def __init__(self, client):
        self.client = client

    def add_message_to_history(self, db: Session, conversation_id: str, sender: str, message: str):
        """
        Appends a new message to the conversation history in Redis and persists it to the database.
        """
        # Add to Redis
        key = f"chat_history:{conversation_id}"
        new_message_redis = {
            "id": str(uuid.uuid4()),
            "job_id": conversation_id,
            "sender": sender,
            "content": message,
            "created_at": datetime.utcnow().isoformat()
        }
        self.client.rpush(key, json.dumps(new_message_redis))

        # Persist to PostgreSQL
        db_message = db_models.ChatMessage(
            job_id=uuid.UUID(conversation_id),
            sender=sender,
            content=message,
            created_at=datetime.utcnow()
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)

history_service = HistoryService(redis_client)