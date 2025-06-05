from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
from urllib.parse import urlparse, parse_qs
from api.gemini_client import generate_from_youtube

from google import genai
from google.generativeai import types 

import os
from dotenv import load_dotenv
load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

router = APIRouter()

class YouTubeGenerateRequest(BaseModel):
    youtube_url: str
    prompt: str
    model: str = "gemini-2.5-flash-preview-05-20"

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various YouTube URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    raise ValueError("Invalid YouTube URL")

@router.post("/youtube")
async def analyze_youtube_video(request: YouTubeGenerateRequest):
    """
    Analyze a YouTube video from its URL using Gemini API..
    """
    try:
        # Extract video ID from URL
        video_id = extract_video_id(request.youtube_url)
        
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"

        response = await generate_from_youtube(request.youtube_url, request.prompt, request.model)
        return {"response": response}

        return {
            "video_id": video_id,
            "title": "YouTube Video Analysis",
            "summary": response.text,
            "message": "YouTube video analysis completed successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")