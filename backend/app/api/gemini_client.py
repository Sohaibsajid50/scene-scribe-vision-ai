import os
from dotenv import load_dotenv
from pathlib import Path

# Force load .env from project root
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

print("🔐 API_KEY =", os.getenv("GOOGLE_API_KEY"))
import time
from google import genai
from fastapi import UploadFile
import tempfile

client = genai.Client(api_key="AIzaSyAMQ0rqJAa3q8cwlNUME_Xm_fZ3xo4K9Jg")

import mimetypes

async def upload_to_gemini(file: UploadFile):
    file_bytes = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name

    # Try to guess the MIME type based on the filename extension
    guessed_type, _ = mimetypes.guess_type(file.filename)

    if not guessed_type:
        raise Exception("Unable to guess MIME type. Please use a standard video file like .mp4")

    myfile = client.files.upload(file=temp_file_path)

    # Wait until the file becomes ACTIVE
    while True:
        status = client.files.get(name=myfile.name).state
        if status == "ACTIVE":
            break
        elif status == "FAILED":
            raise Exception("Gemini file processing failed.")
        time.sleep(2)

    return myfile


# async def upload_to_gemini(file: UploadFile):
#     """
#     Upload a file to Gemini and get the response.
#     """
#     # Create a temporary file to store the uploaded file
#     with tempfile.NamedTemporaryFile(delete=False) as temp_file:
#         temp_file.write(await file.read())
#         temp_file_path = temp_file.name

#     # Upload the file to Gemini
#     myfile = client.files.upload(file=temp_file_path,
#     mime_type=file.content_type)

#     # Wait for the file to become ACTIVE
#     while True:
#         status = client.files.get(name=myfile.name).state
#         if status == "ACTIVE":
#             break
#         elif status == "FAILED":
#             raise Exception("❌ File processing failed.")
#         time.sleep(2)  # wait before checking again

#     return myfile

def generate_from_file(file_id: str, prompt: str, model: str):
    file_reference = client.files.get(name=file_id)
    response = client.models.generate_content(
        model=model,
        contents=[file_reference, prompt]
    )
    return response
