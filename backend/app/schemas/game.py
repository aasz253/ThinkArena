from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GameCreate(BaseModel):
    quiz_id: str


class GameResponse(BaseModel):
    id: str
    quiz_id: str
    host_id: str
    pin: str
    status: str
    current_question: int
    total_questions: int
    started_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlayerResponse(BaseModel):
    id: str
    game_id: str
    user_id: Optional[str] = None
    nickname: str
    score: int
    streak: int
    correct_count: int
    total_answered: int
    is_connected: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class PlayerJoin(BaseModel):
    game_pin: str
    nickname: str


class AnswerSubmit(BaseModel):
    question_id: str
    selected_choice_id: Optional[str] = None
    answer_text: Optional[str] = None
    time_taken: float = 0.0


class AnswerResponse(BaseModel):
    id: str
    player_id: str
    question_id: str
    selected_choice_id: Optional[str] = None
    answer_text: Optional[str] = None
    is_correct: bool
    time_taken: float
    points_earned: int
    streak_bonus: int

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    id: str
    player_id: str
    player_nickname: str
    score: int
    correct_count: int
    total_questions: int
    rank: int

    class Config:
        from_attributes = True


class GameResults(BaseModel):
    game_id: str
    quiz_title: str
    players: List[LeaderboardResponse]
    total_questions: int
    started_at: datetime
    ended_at: Optional[datetime] = None


class GameHistoryResponse(BaseModel):
    id: str
    quiz_title: str
    pin: str
    status: str
    player_count: int
    score: Optional[int] = None
    rank: Optional[int] = None
    started_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
