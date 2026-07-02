import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register():
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "role": "student",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email():
    client.post("/auth/register", json={
        "username": "user1",
        "email": "dup@example.com",
        "password": "password123",
    })
    response = client.post("/auth/register", json={
        "username": "user2",
        "email": "dup@example.com",
        "password": "password123",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login():
    client.post("/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password123",
    })
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_invalid():
    response = client.post("/auth/login", json={
        "email": "nonexist@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


def test_me():
    client.post("/auth/register", json={
        "username": "meuser",
        "email": "me@example.com",
        "password": "password123",
    })
    login_resp = client.post("/auth/login", json={
        "email": "me@example.com",
        "password": "password123",
    })
    token = login_resp.json()["access_token"]
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "meuser"
