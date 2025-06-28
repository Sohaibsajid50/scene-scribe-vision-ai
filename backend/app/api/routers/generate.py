from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import dotenv
import os
import google.generativeai as genai
from langgraph_supervisor import create_supervisor
from api.routers.youtube import youtube_agent
from api.routers.file_agent import file_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage

router = APIRouter()

dotenv.load_dotenv()

# Initialize the Generative AI client
genai.configure(api_key=os.getenv("OPENAI_API_KEY"))
model = ChatOpenAI(model="gpt-4o")

class GenerateRequest(BaseModel):
    file_id: Optional[str] = None
    prompt: str
    # model: str = "gemini-2.5-flash-preview-05-20"

supervisor_workflow = create_supervisor(
    agents=[file_agent, youtube_agent],
    model=model,
    prompt=(
        "You are a planner agent that decides which sub-agent to use based on the user's input. "
        "You will receive a user prompt and a file ID or YouTube URL. "
        "You will determine which sub-agent ('file' or 'youtube') should handle the request."
    ),
    output_mode="last_message",
    supervisor_name="planner_agent",
)

supervisor_app = supervisor_workflow.compile()

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    try:
        combined_prompt = f"{request.prompt} \n\nfile_id_or_url: {request.file_id}"
        result = supervisor_app.invoke({
            "messages": [{
                "role": "user",
                "content": combined_prompt,
            }]
        })
        print("🔍 Supervisor result:", result)
        messages = result.get("messages", [])
        
        # Look for the first substantial content from any tool agent
        for message in reversed(messages):
            if isinstance(message, AIMessage) and message.content.strip():
                # Skip transfer messages and confirmation messages
                if (
                    not message.content.startswith("Transferring") and
                    not message.content.endswith("successfully by the file agent") and
                    not message.content == "Successfully transferred"
                ):
                    return {"response": message.content.strip()}
        
        # If no substantial content found, return the last non-empty message
        for message in reversed(messages):
            if isinstance(message, AIMessage) and message.content.strip():
                return {"response": message.content.strip()}
        
        raise HTTPException(status_code=500, detail="No usable response from agents.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))