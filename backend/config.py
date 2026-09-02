import os
import sys
import json
from typing import List
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DB_FILE_PATH = os.path.join(ROOT_DIR, "database", "resq.db").replace("\\", "/")
DEFAULT_DB_URL = f"sqlite:///{DB_FILE_PATH}"

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ResQ Disaster Relief & Volunteer Coordination")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "resq-super-secure-production-ready-jwt-secret-key-replace-in-prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Initial Admin Setup
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@resq.org")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    
    # File Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(ROOT_DIR, "uploads"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "webp", "pdf", "mp3", "wav", "m4a", "ogg"}
    
    # CORS
    _cors_origins_env = os.getenv("CORS_ORIGINS", '["*"]')
    try:
        CORS_ORIGINS: List[str] = json.loads(_cors_origins_env)
    except Exception:
        CORS_ORIGINS: List[str] = ["*"]

settings = Settings()

# Ensure required local directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "database"), exist_ok=True)

