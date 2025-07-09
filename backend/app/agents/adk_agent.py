import os
from dotenv import load_dotenv
from google import genai
from google.generativeai import types
from google.adk.agents import Agent, BaseAgent
from google.adk.tools import agent_tool
from google.adk.events import Event
from pydantic import BaseModel
from fastapi import UploadFile
import time
import re
import tempfile

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def upload_to_gemini(file: UploadFile):
    """Uploads a file to Gemini and returns the file object."""
    file_bytes = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
        temp_file.write(file_bytes)
        temp_file_path = temp_file.name

    print(f"Uploading file: {temp_file_path}")
    myfile = client.files.upload(file=temp_file_path)
    print(f"File uploaded: {myfile.name}, state: {myfile.state}")

    while myfile.state != "ACTIVE":
        print(f"Waiting for file to become active. Current state: {myfile.state}")
        time.sleep(2)
        myfile = client.files.get(name=myfile.name)
        if myfile.state == "FAILED":
            raise Exception(f"Gemini file processing failed: {myfile.error}")

    print(f"File is active: {myfile.name}")
    os.remove(temp_file_path)
    return myfile


class YouTubeGeneratorAgent(BaseAgent):
    name: str = "YouTubeGenerator"
    description: str = "Generates text from a YouTube video and prompt."

    async def _run_async_impl(self, ctx):
        youtube_url = ctx.session.state.get("youtube_url")
        prompt = ctx.session.state.get("prompt")
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=types.Content(
                parts=[
                    types.Part(
                        file_data=types.FileData(file_uri=youtube_url),
                    ),
                    types.Part(text=prompt)
                ]
            )
        )

        llm_content = types.Content(parts=[types.Part(text="")])
        video_text = ""

        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            llm_content = response.candidates[0].content
            video_text = llm_content.parts[0].text or ""

        ctx.session.state["video_text"] = video_text
        yield Event(author=self.name, content=llm_content)

yt_agent = YouTubeGeneratorAgent()
yt_tool = agent_tool.AgentTool(agent=yt_agent)


class VideoGeneratorAgent(BaseAgent):
    name: str = "VideoGenerator"
    description: str = "Generates text from an uploaded video file and prompt."

    async def _run_async_impl(self, ctx):
        file_id = ctx.session.state.get("file_id")
        prompt = ctx.session.state.get("prompt")

        file_reference = client.files.get(name=file_id)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[file_reference, prompt]
        )

        llm_content = types.Content(parts=[types.Part(text="")])
        video_text = ""

        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            llm_content = response.candidates[0].content
            video_text = llm_content.parts[0].text or ""

        ctx.session.state["video_text"] = video_text
        yield Event(author=self.name, content=llm_content)

video_agent = VideoGeneratorAgent()
video_tool = agent_tool.AgentTool(agent=video_agent)

# def create_planner_agent():

#         planner_agent = Agent(
#             name="Analyzer",
#             model="gemini-1.5-flash",
#             instruction="You are a conversational agent that analyzes videos and answers questions about them. "
#                         "Your first task is to get the video content. If the user provides a YouTube URL, use the YouTubeGenerator agent. "
#                         "If the user provides a file ID, use the VideoGenerator agent. "
#                         "Once the video content is stored in 'video_text' in the session state, you must answer all follow-up questions using that text. "
#                         "Do not use the tools again for the same video. "
#                         "If the user wants to discuss a new video, they must start a new conversation.",
#             description="Orchestrates video analysis and answers follow-up questions based on the extracted text.",
#             tools=[video_tool, yt_tool]
#         )
#         return planner_agent

# root_agent = create_planner_agent