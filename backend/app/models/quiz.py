from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

quiz_tags = Table(
    "quiz_tags",
    Base.metadata,
    Column("quiz_id", String, ForeignKey("quizzes.id", ondelete="CASCADE")),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE")),
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quizzes = relationship("Quiz", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    is_private = Column(Boolean, default=False)
    difficulty = Column(String, default="medium")
    category_id = Column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    creator_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    time_per_question = Column(Integer, default=10)
    points_per_question = Column(Integer, default=1000)
    randomize_questions = Column(Boolean, default=False)
    randomize_answers = Column(Boolean, default=True)
    play_count = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="quizzes")
    category = relationship("Category", back_populates="quizzes")
    tags = relationship("Tag", secondary=quiz_tags, backref="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order")
    games = relationship("Game", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="multiple_choice")
    explanation = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    order = Column(Integer, default=0)
    points = Column(Integer, default=1000)
    time_limit = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="questions")
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")


class Choice(Base):
    __tablename__ = "choices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    choice_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    question = relationship("Question", back_populates="choices")
