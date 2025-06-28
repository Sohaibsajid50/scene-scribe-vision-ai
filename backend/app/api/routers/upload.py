from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from api.gemini_client import upload_to_gemini
from api.gemini_client import client

router = APIRouter()

@router.post("/upload")
async def upload_or_analyze_file(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None)
):
    """
    Upload a file to Gemini and get the response.
    """
    try:
        if file:
            response = await upload_to_gemini(file)
            return {
                "file_id": response.name,
                "status": response.state
            }
        elif youtube_url:
            return {"youtube_url": youtube_url}
        else:
            raise HTTPException(status_code=400, detail="No input provided.")
    except Exception as e:
        print("Upload failed:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/files/{file_id}")
async def check_file_status(file_id: str):
    try:
        status = client.files.get(name=file_id).state
        return {"file_id": file_id, "status": status}
    except Exception as e:
        return {"file_id": file_id, "status": "ERROR", "error": str(e)}