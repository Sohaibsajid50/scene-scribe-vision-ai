from sqlalchemy.orm import Session
from app.models import db_models, api_models
from app.security.core import get_password_hash

def get_user_by_email(db: Session, email: str) -> db_models.User:
    """
    Fetches a user by their email address.
    """
    return db.query(db_models.User).filter(db_models.User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str) -> db_models.User:
    """
    Fetches a user by their Google ID.
    """
    return db.query(db_models.User).filter(db_models.User.google_id == google_id).first()

def create_user(db: Session, user: api_models.UserCreate) -> db_models.User:
    """
    Creates a new user in the database with email, first name, last name, and password.
    """
    hashed_password = get_password_hash(user.password)
    db_user = db_models.User(email=user.email, first_name=user.first_name, last_name=user.last_name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_google(db: Session, user: api_models.UserCreateGoogle) -> db_models.User:
    """
    Creates a new user in the database with Google ID, first name, and last name.
    """
    db_user = db_models.User(email=user.email, google_id=user.google_id, first_name=user.first_name, last_name=user.last_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_google_id(db: Session, user_id: int, google_id: str) -> db_models.User:
    """
    Updates an existing user's Google ID.
    """
    db_user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if db_user:
        db_user.google_id = google_id
        db.commit()
        db.refresh(db_user)
    return db_user

def update_user_name(db: Session, user_id: int, first_name: str, last_name: str) -> db_models.User:
    """
    Updates an existing user's first and last name.
    """
    db_user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if db_user:
        db_user.first_name = first_name
        db_user.last_name = last_name
        db.commit()
        db.refresh(db_user)
    return db_user
