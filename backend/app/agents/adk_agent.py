from langchain_google_vertexai import ChatVertexAI
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from google import genai
from langgraph_supervisor import create_supervisor
import vertexai
from google.generativeai import types
import google.generativeai as generativeai
import tempfile
from fastapi import UploadFile
import time
import re

load_dotenv()

generativeai.configure(api_key=os.getenv("OPENAI_API_KEY"))
model = ChatOpenAI(model="gpt-4o")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

vertexai.init(project=os.getenv("GOOGLE_CLOUD_PROJECT"), location=os.getenv("GOOGLE_CLOUD_LOCATION"))


# Define the tools for the agents
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

def generate_from_video(file_id: str, prompt: str):
    "Use this tool to generate from file uding the file id"
    file_reference = client.files.get(name=file_id)
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-05-20",
        contents=[file_reference, prompt]
    )
    return response.text

def generate_from_youtube(youtube_url: str, prompt: str):
    "Use this tool to generate from the youtube url"
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-05-20",
        contents=types.Content(
            parts=[
                types.Part(
                    file_data=types.FileData(file_uri=youtube_url),
                ),
                types.Part(text=prompt)
            ]
        )
    )
    return response.text

# Create the agents
video_agent = create_react_agent(
    model="gemini-2.5-flash-preview-05-20",
    tools=[generate_from_video],
    name="video_agent",
    prompt=("You are a file agent that generates content based on files. "
            "You will receive a file ID and a prompt. "
            "Your task is to generate content based on the file and the given prompt."),
)

youtube_agent = create_react_agent(
    model="gemini-2.5-flash-preview-05-20",
    tools=[generate_from_youtube],
    name="youtube_generator",
    prompt=("You are a YouTube agent that generates content based on YouTube videos. "
              "You will receive a YouTube URL and a prompt. "
              "Your task is to generate content based on the video at the provided URL and the given prompt."),
)




# Define the state for the supervisor
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]

# Create the supervisor
supervisor_workflow = create_supervisor(
    agents=[video_agent, youtube_agent],
    model=model,
    prompt=(
        "You are a planner agent that decides which sub-agent to use based on the user's input. "
        "You will receive a user prompt and a file ID or YouTube URL. "
        "You will determine which sub-agent ('video_agent' or 'youtube_agent') should handle the request."
    ),
    output_mode="last_message",
    supervisor_name="planner_agent",
)

adk_app = supervisor_workflow.compile()
