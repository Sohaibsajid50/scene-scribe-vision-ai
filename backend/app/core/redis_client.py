import redis
import json
from typing import List, Dict

class RedisClient:
    def __init__(self, host='localhost', port=6379, db=0):
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)

    def rpush(self, key: str, value: str):
        self.client.rpush(key, value)

    def lrange(self, key: str, start: int, end: int) -> List[str]:
        return self.client.lrange(key, start, end)

    def get_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """Retrieves the current chat history for a job from Redis."""
        key = f"chat_history:{conversation_id}"
        history_json = self.lrange(key, 0, -1)
        return [json.loads(msg) for msg in history_json]

    def delete_history(self, conversation_id: str):
        """Deletes the chat history for a given job from Redis."""
        key = f"chat_history:{conversation_id}"
        self.client.delete(key)

redis_client = RedisClient()