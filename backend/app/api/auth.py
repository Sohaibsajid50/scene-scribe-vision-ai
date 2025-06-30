from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, security
from app.api import dependencies
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=models.api_models.User)
def register_user(
    user_in: models.api_models.UserCreate, db: Session = Depends(dependencies.get_db)
):
    """
    Register a new user.
    """
    user = crud.user_crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    user = crud.user_crud.create_user(db, user=user_in)
    return user


@router.post("/login", response_model=models.api_models.Token)
def login_for_access_token(
    db: Session = Depends(dependencies.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    Authenticate user and return a JWT access token.
    """
    user = crud.user_crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.core.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token = security.core.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}
