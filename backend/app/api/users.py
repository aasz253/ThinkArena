from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Profile, Achievement, Badge
from app.schemas.user import ProfileUpdate, ProfileResponse, AchievementResponse, BadgeResponse
from app.services.auth import get_current_user
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    if not current_user.profile:
        profile = Profile(user_id=current_user.id, display_name=current_user.username)
        db = next(get_db())
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return current_user.profile


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id, display_name=current_user.username)
        db.add(profile)
        db.flush()
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(current_user: User = Depends(get_current_user)):
    return current_user.achievements


@router.get("/badges", response_model=List[BadgeResponse])
def get_badges(current_user: User = Depends(get_current_user)):
    return current_user.badges


@router.get("/leaderboard", response_model=List[dict])
def get_leaderboard(limit: int = 50, db: Session = Depends(get_db)):
    profiles = (
        db.query(Profile)
        .join(User)
        .filter(User.role == "student")
        .order_by(Profile.xp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "user_id": p.user_id,
            "username": p.user.username,
            "display_name": p.display_name,
            "avatar_url": p.avatar_url,
            "xp": p.xp,
            "level": p.level,
            "games_played": p.games_played,
            "accuracy": p.accuracy,
        }
        for i, p in enumerate(profiles)
    ]


@router.get("/{user_id}", response_model=dict)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = user.profile
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "profile": {
            "display_name": profile.display_name if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "bio": profile.bio if profile else None,
            "xp": profile.xp if profile else 0,
            "level": profile.level if profile else 1,
            "games_played": profile.games_played if profile else 0,
            "accuracy": profile.accuracy if profile else 0.0,
        } if profile else None,
    }
