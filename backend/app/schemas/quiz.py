from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChoiceCreate(BaseModel):
    choice_text: str
    is_correct: bool = False
    order: int = 0


class ChoiceResponse(BaseModel):
    id: str
    choice_text: str
    is_correct: bool
    order: int

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    order: int = 0
    points: int = 1000
    time_limit: int = 20
    choices: List[ChoiceCreate] = []


class QuestionResponse(BaseModel):
    id: str
    quiz_id: str
    question_text: str
    question_type: str
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    order: int
    points: int
    time_limit: int
    choices: List[ChoiceResponse] = []

    class Config:
        from_attributes = True


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_public: bool = True
    difficulty: str = "medium"
    category_id: Optional[str] = None
    tag_ids: List[str] = []
    time_per_question: int = 20
    points_per_question: int = 1000
    randomize_questions: bool = False
    randomize_answers: bool = True
    questions: List[QuestionCreate] = []


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_public: Optional[bool] = None
    difficulty: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    time_per_question: Optional[int] = None
    points_per_question: Optional[int] = None
    randomize_questions: Optional[bool] = None
    randomize_answers: Optional[bool] = None


class QuizListResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    difficulty: str
    is_public: bool
    category_name: Optional[str] = None
    creator_name: str
    question_count: int = 0
    play_count: int
    likes: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuizDetailResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_public: bool
    difficulty: str
    category_id: Optional[str] = None
    creator_id: str
    creator_name: str
    time_per_question: int
    points_per_question: int
    randomize_questions: bool
    randomize_answers: bool
    play_count: int
    likes: int
    question_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class TagResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True
