from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# Create the SQLAlchemy engine for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for our models to inherit from
Base = declarative_base()

# Dependency to get a DB session for API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
