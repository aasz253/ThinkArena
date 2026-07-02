from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    xp: int = 0
    level: int = 1
    games_played: int = 0
    games_hosted: int = 0
    quizzes_created: int = 0
    total_score: int = 0
    highest_score: int = 0
    win_streak: int = 0
    best_streak: int = 0
    correct_answers: int = 0
    total_answers: int = 0
    accuracy: float = 0.0

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    unlocked_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    badge_type: Optional[str] = None
    unlocked_at: datetime

    class Config:
        from_attributes = True


class UserWithProfile(UserResponse):
    profile: Optional[ProfileResponse] = None
