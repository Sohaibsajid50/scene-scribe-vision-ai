import os
from dotenv import load_dotenv
from pathlib import Path
from google.genai import types

# # Force load .env from project root
# env_path = Path(__file__).resolve().parents[1] / ".env"
# load_dotenv(dotenv_path=env_path)

import time
from google import genai
from fastapi import UploadFile
import tempfile


load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

async def upload_to_gemini(file: UploadFile):
    file_bytes = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name

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
    "Use this tool to generate from file uding the file id"
    file_reference = client.files.get(name=file_id)
    response = client.models.generate_content(
        model=model,
        contents=[file_reference, prompt]
    )
    return response
def generate_from_youtube(youtube_url: str, prompt: str, model: str):
    "Use this tool to generate from the youtube url"
    response = client.models.generate_content(
        model=model,
        contents=types.Content(
            parts=[
                types.Part(
                    file_data=types.FileData(file_uri=youtube_url),
                ),
                types.Part(text=prompt)
            ]
        )
    )