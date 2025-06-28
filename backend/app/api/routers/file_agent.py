from fastapi import HTTPException
from api.gemini_client import generate_from_file
from langgraph.prebuilt import create_react_agent
from google.genai import types
from google import genai
from dotenv import load_dotenv
import os
# from app.utils.logging import log_event

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

file_agent = create_react_agent(
    model="gemini-2.5-flash-preview-05-20",
    tools=[generate_from_file],
    name="file_generator",
    prompt=("You are a file agent that generates content based on files. "
            "You will receive a file ID and a prompt. "
            "First upload the file to Gemini using upload_to_gemini, then generate content based on the file and the prompt. "
            "Your task is to generate content based on the file and the given prompt."),
)

def generate_from_file(file_id: str, prompt: str):
    "Use this tool to generate from file uding the file id"
    file_reference = client.files.get(name=file_id)
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-05-20",
        contents=[file_reference, prompt]
    )
    return response