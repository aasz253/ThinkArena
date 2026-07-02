from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User
from app.services.auth import get_current_user
from app.services.ai import (
    generate_quiz, generate_questions, generate_explanation,
    summarize_quiz, recommend_difficulty, ai_tutor,
    ai_study_assistant,
)
from pydantic import BaseModel
from typing import List, Optional
import json
import re

router = APIRouter(prefix="/ai", tags=["AI"])


def _parse_json_response(raw: str) -> dict:
    clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    return json.loads(clean)


class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    num_questions: int = 5
    question_types: List[str] = ["multiple_choice"]


class QuestionsGenerateRequest(BaseModel):
    topic: str
    count: int = 3
    question_type: str = "multiple_choice"


class ExplanationRequest(BaseModel):
    question: str
    correct_answer: str


class SummarizeRequest(BaseModel):
    quiz_title: str
    questions: List[dict]


class TutorRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str


class StudyAssistantRequest(BaseModel):
    topic: str
    user_level: str = "intermediate"


@router.post("/generate-quiz")
def api_generate_quiz(
    data: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["teacher", "administrator"]:
        raise HTTPException(status_code=403, detail="Only teachers can use AI generation")
    result = generate_quiz(data.topic, data.difficulty, data.num_questions, data.question_types)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result, "error": "Failed to parse AI response as JSON"}


@router.post("/generate-questions")
def api_generate_questions(
    data: QuestionsGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["teacher", "administrator"]:
        raise HTTPException(status_code=403, detail="Only teachers can use AI generation")
    result = generate_questions(data.topic, data.count, data.question_type)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}


@router.post("/explain")
def api_explain(data: ExplanationRequest, current_user: User = Depends(get_current_user)):
    result = generate_explanation(data.question, data.correct_answer)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}


@router.post("/summarize")
def api_summarize(data: SummarizeRequest, current_user: User = Depends(get_current_user)):
    result = summarize_quiz(data.quiz_title, data.questions)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}


@router.post("/recommend-difficulty")
def api_recommend_difficulty(data: dict, current_user: User = Depends(get_current_user)):
    result = recommend_difficulty(data.get("topic", ""))
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}


@router.post("/tutor")
def api_tutor(data: TutorRequest, current_user: User = Depends(get_current_user)):
    result = ai_tutor(data.question, data.user_answer, data.correct_answer)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}


@router.post("/study-assistant")
def api_study_assistant(data: StudyAssistantRequest, current_user: User = Depends(get_current_user)):
    result = ai_study_assistant(data.topic, data.user_level)
    try:
        return _parse_json_response(result)
    except json.JSONDecodeError:
        return {"raw": result}
