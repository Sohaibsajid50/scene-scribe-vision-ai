from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SceneSpeak API",
    description="Backend services for the SceneSpeak application.",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Default Vite dev server port
    "http://localhost:3000",  # Common React dev server port
    "http://localhost:8080",
    # Add your production frontend URL here when you have one
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"status": "ok", "message": "Welcome to the Scene Speak API!"}

# In the future, we will include our API routers here
from .api import auth, chat

app.include_router(auth.router)
app.include_router(chat.router)
