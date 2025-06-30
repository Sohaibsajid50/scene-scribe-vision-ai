from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api import dependencies
from app.agents.adk_agent import adk_app
from langchain_core.messages import HumanMessage

router = APIRouter()

class AdkChatRequest(BaseModel):
    message: str
    file_id_or_url: str

@router.post("/")
async def adk_chat(
    request: AdkChatRequest,
    db: Session = Depends(dependencies.get_db),
):
    """
    A temporary endpoint to test the new ADK agent.
    """
    try:
        # Combine the user's message with the file information
        combined_message = f"{request.message}\n\nFile: {request.file_id_or_url}"
        
        result = adk_app.invoke({
            "messages": [HumanMessage(content=combined_message)]
        })
        
        # Extract the relevant response content
        response_content = ""
        if isinstance(result, dict) and "messages" in result:
            for message in reversed(result["messages"]):
                if hasattr(message, 'content') and message.content.strip():
                    response_content = message.content
                    break

        return {"response": response_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
