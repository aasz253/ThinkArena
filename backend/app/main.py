from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.api import auth, users, quizzes, games, ai, admin
from app.middleware.security import (
    RateLimitMiddleware, SecurityHeadersMiddleware,
    InputValidationMiddleware, AutomationBlockerMiddleware,
    PathTraversalMiddleware,
)
from app.services.auth import hash_password
from app.models.user import User, Profile
from app.database import SessionLocal
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ThinkArena API",
    description="AI-Powered Quiz Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(PathTraversalMiddleware)
app.add_middleware(AutomationBlockerMiddleware)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(quizzes.router)
app.include_router(games.router)
app.include_router(ai.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    # Seed default admin
    try:
        db = SessionLocal()
        others = db.query(User).filter(
            User.role == "administrator",
            User.email != "www.antonysifuna07@gmail.com"
        ).all()
        for u in others:
            db.delete(u)
        existing = db.query(User).filter(User.email == "www.antonysifuna07@gmail.com").first()
        if existing:
            existing.hashed_password = hash_password("ThinkArena@2026")
            existing.role = "administrator"
            existing.is_active = True
            existing.is_verified = True
            if not existing.profile:
                existing.profile = Profile(id=str(uuid.uuid4()), display_name="Admin")
        else:
            admin = User(
                id=str(uuid.uuid4()),
                email="www.antonysifuna07@gmail.com",
                username="admin",
                hashed_password=hash_password("ThinkArena@2026"),
                role="administrator",
                is_active=True,
                is_verified=True,
            )
            admin.profile = Profile(id=str(uuid.uuid4()), display_name="Admin")
            db.add(admin)
        db.commit()
        logger.info("Default admin seeded: www.antonysifuna07@gmail.com")
    except Exception as e:
        logger.error(f"Failed to seed admin: {e}")
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown():
    logger.info("Shutting down ThinkArena API")


@app.get("/")
def root():
    return {
        "name": "ThinkArena API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )
