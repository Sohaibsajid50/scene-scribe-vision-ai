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

    def get_history(self, conversation_id: str) -> List[str]:
        """Retrieves the current chat history for a job from Redis as a list of JSON strings."""
        key = f"chat_history:{conversation_id}"
        return self.lrange(key, 0, -1)

redis_client = RedisClient()