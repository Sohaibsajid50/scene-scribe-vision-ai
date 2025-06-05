from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.gemini_client import generate_from_file
from api.gemini_client import generate_from_youtube

router = APIRouter()

class GenerateRequest(BaseModel):
    file_id: str
    prompt: str
    model: str = "gemini-2.5-flash-preview-05-20"

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    """
    Generate content from a file using Gemini.
    """
    try:
        # Generate content from the file
        response = await generate_from_file(request.file_id, request.prompt, request.model)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))