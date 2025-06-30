from sqlalchemy.orm import Session
from app.models import db_models, api_models
from app.security.core import get_password_hash

def get_user_by_email(db: Session, email: str) -> db_models.User:
    """
    Fetches a user by their email address.
    """
    return db.query(db_models.User).filter(db_models.User.email == email).first()


def create_user(db: Session, user: api_models.UserCreate) -> db_models.User:
    """
    Creates a new user in the database.
    """
    hashed_password = get_password_hash(user.password)
    db_user = db_models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
