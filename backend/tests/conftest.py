import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///./database/test_resq.db"

from database import Base, get_db
import models
from main import app
from auth import get_password_hash

TEST_DB_URL = "sqlite:///./database/test_resq.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Create test users
    db = TestingSessionLocal()
    admin = models.User(
        username="testadmin",
        email="testadmin@resq.org",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Test Admin",
        role="admin",
        phone="+91 99999 00001",
        is_active=True
    )
    operator = models.User(
        username="testoperator",
        email="testoperator@resq.org",
        hashed_password=get_password_hash("Operator@123"),
        full_name="Test Operator",
        role="operator",
        phone="+91 99999 00002",
        is_active=True
    )
    citizen = models.User(
        username="testcitizen",
        email="testcitizen@resq.org",
        hashed_password=get_password_hash("Citizen@123"),
        full_name="Test Citizen",
        role="citizen",
        phone="+91 99999 00003",
        is_active=True
    )
    db.add_all([admin, operator, citizen])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./database/test_resq.db"):
        try:
            os.remove("./database/test_resq.db")
        except Exception:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
