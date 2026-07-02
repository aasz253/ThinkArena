from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Game(Base):
    __tablename__ = "games"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    host_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pin = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="waiting")
    current_question = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="games")
    host = relationship("User", back_populates="games_as_host", foreign_keys=[host_id])
    players = relationship("Player", back_populates="game", cascade="all, delete-orphan")
    leaderboard = relationship("LeaderboardEntry", back_populates="game", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    nickname = Column(String, nullable=False)
    score = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    total_answered = Column(Integer, default=0)
    is_connected = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    game = relationship("Game", back_populates="players")
    user = relationship("User", back_populates="players")
    answers = relationship("Answer", back_populates="player", cascade="all, delete-orphan")

    @property
    def accuracy(self) -> float:
        if self.total_answered == 0:
            return 0.0
        return round((self.correct_count / self.total_answered) * 100, 2)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    selected_choice_id = Column(String, nullable=True)
    answer_text = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    time_taken = Column(Float, default=0.0)
    points_earned = Column(Integer, default=0)
    streak_bonus = Column(Integer, default=0)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    player = relationship("Player", back_populates="answers")
    game = relationship("Game")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id = Column(String, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(String, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    rank = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    game = relationship("Game", back_populates="leaderboard")
    player = relationship("Player")
