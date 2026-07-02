from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="creator", cascade="all, delete-orphan")
    games_as_host = relationship("Game", back_populates="host", foreign_keys="Game.host_id")
    players = relationship("Player", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    games_played = Column(Integer, default=0)
    games_hosted = Column(Integer, default=0)
    quizzes_created = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    highest_score = Column(Integer, default=0)
    win_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_answers = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="profile")

    @property
    def accuracy(self) -> float:
        if self.total_answers == 0:
            return 0.0
        return round((self.correct_answers / self.total_answers) * 100, 2)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="achievements")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    badge_type = Column(String, nullable=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")
