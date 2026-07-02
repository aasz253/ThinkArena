from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.user import User, Profile
from app.models.quiz import Quiz, Category
from app.models.game import Game, Player
from app.models.log import Log
from app.services.auth import get_current_user, require_role
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_teachers = db.query(func.count(User.id)).filter(User.role == "teacher").scalar()
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar()
    total_quizzes = db.query(func.count(Quiz.id)).scalar()
    total_games = db.query(func.count(Game.id)).scalar()
    total_players = db.query(func.count(Player.id)).scalar()

    recent_users = (
        db.query(User)
        .order_by(desc(User.created_at))
        .limit(5)
        .all()
    )

    recent_quizzes = (
        db.query(Quiz)
        .order_by(desc(Quiz.created_at))
        .limit(5)
        .all()
    )

    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "total_games": total_games,
        "total_players": total_players,
        "recent_users": [
            {"id": u.id, "username": u.username, "email": u.email, "role": u.role, "created_at": u.created_at}
            for u in recent_users
        ],
        "recent_quizzes": [
            {"id": q.id, "title": q.title, "creator": q.creator.username, "play_count": q.play_count, "created_at": q.created_at}
            for q in recent_quizzes
        ],
    }


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at,
            "xp": u.profile.xp if u.profile else 0,
            "level": u.profile.level if u.profile else 1,
        }
        for u in users
    ]


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    data: dict,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_role = data.get("role")
    if new_role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = new_role
    db.commit()
    return {"message": "User role updated"}


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}


@router.get("/quizzes")
def list_all_quizzes(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    quizzes = db.query(Quiz).order_by(desc(Quiz.created_at)).offset(skip).limit(limit).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "creator": q.creator.username,
            "difficulty": q.difficulty,
            "is_public": q.is_public,
            "play_count": q.play_count,
            "question_count": len(q.questions),
            "created_at": q.created_at,
        }
        for q in quizzes
    ]


@router.get("/logs")
def view_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    logs = db.query(Log).order_by(desc(Log.created_at)).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.delete("/quizzes/{quiz_id}")
def admin_delete_quiz(
    quiz_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted by admin"}
