from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.crud import user_crud
from app.models import api_models
from app.security import core
from app.api import dependencies
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=api_models.User)
def register_user(
    user_in: api_models.UserCreate, db: Session = Depends(dependencies.get_db)
):
    """
    Register a new user.
    """
    user = user_crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    user = user_crud.create_user(db, user=user_in)
    return user


@router.post("/login", response_model=api_models.Token)
def login_for_access_token(
    db: Session = Depends(dependencies.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    Authenticate user and return a JWT access token.
    """
    user = user_crud.get_user_by_email(db, email=form_data.username)
    if not user or not core.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token = core.create_access_token(
        data={"sub": user.email, "first_name": user.first_name, "last_name": user.last_name}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google-login", response_model=api_models.Token)
async def google_login(
    request: api_models.GoogleIdTokenRequest, db: Session = Depends(dependencies.get_db)
):
    """
    Authenticate user with Google ID token and return a JWT access token.
    """
    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        google_id_info = id_token.verify_oauth2_token(
            request.id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        print(f"[Google Login] ID Token verified. Info: {google_id_info}")
        
        google_user_id = google_id_info['sub']
        email = google_id_info['email']
        first_name = google_id_info.get('given_name', '')
        last_name = google_id_info.get('family_name', '')

        user = user_crud.get_user_by_google_id(db, google_id=google_user_id)
        if not user:
            # If user doesn't exist with google_id, check by email
            user = user_crud.get_user_by_email(db, email=email)
            if user:
                # If user exists with email but no google_id, link google_id and update names if empty
                user = user_crud.update_user_google_id(db, user_id=user.id, google_id=google_user_id)
                if not user.first_name:
                    user = user_crud.update_user_name(db, user_id=user.id, first_name=first_name, last_name=last_name)
            else:
                # Create new user with google_id and names
                user_in = api_models.UserCreateGoogle(email=email, google_id=google_user_id, first_name=first_name, last_name=last_name)
                user = user_crud.create_user_google(db, user=user_in)
        
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        access_token = core.create_access_token(
            data={"sub": user.email, "first_name": user.first_name, "last_name": user.last_name}
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate Google credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during Google login: {e}",
        )
