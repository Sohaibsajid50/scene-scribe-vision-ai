from fastapi import APIRouter, UploadFile, File, HTTPException
from api.gemini_client import upload_to_gemini
from api.gemini_client import client

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to Gemini and get the response.
    """
    try:
        response = await upload_to_gemini(file)
        return {"file_id": response.name, "status": response.state}
    except Exception as e:
        print("Upload failed:", str(e))
        raise HTTPException(status_code=500, detail="Upload to Gemini failed.")

@router.get("/status/files/{file_id}")
async def check_file_status(file_id: str):
    try:
        status = client.files.get(name=file_id).state
        return {"file_id": file_id, "status": status}
    except Exception as e:
        return {"file_id": file_id, "status": "ERROR", "error": str(e)}