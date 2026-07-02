from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, Category, Tag
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizDetailResponse, QuizListResponse,
    QuestionResponse, CategoryResponse, CategoryCreate, TagResponse,
)
from app.services.auth import get_current_user
from app.services.quiz import (
    create_quiz, get_quiz, get_public_quizzes, get_user_quizzes,
    update_quiz, delete_quiz, duplicate_quiz, get_categories,
    create_category, get_tags, increment_play_count,
)
from typing import List, Optional

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("", response_model=QuizDetailResponse, status_code=201)
def create_quiz_endpoint(
    data: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["teacher", "administrator"]:
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    quiz = create_quiz(db, data, current_user.id)
    profile = current_user.profile
    if profile:
        profile.quizzes_created += 1
        db.commit()
    return _quiz_to_detail(quiz)


@router.get("", response_model=List[QuizListResponse])
def list_quizzes(
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    mine: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if mine:
        quizzes = get_user_quizzes(db, current_user.id)
    else:
        quizzes = get_public_quizzes(db, skip, limit, category_id, difficulty, search)
    return [_quiz_to_list(q) for q in quizzes]


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return get_categories(db)


@router.post("/categories", response_model=CategoryResponse)
def create_category_endpoint(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Admin only")
    return create_category(db, data.name, data.description, data.icon, data.color)


@router.get("/tags", response_model=List[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return get_tags(db)


@router.get("/{quiz_id}", response_model=QuizDetailResponse)
def get_quiz_endpoint(quiz_id: str, db: Session = Depends(get_db)):
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not quiz.is_public:
        raise HTTPException(status_code=403, detail="Quiz is private")
    return _quiz_to_detail(quiz)


@router.put("/{quiz_id}", response_model=QuizDetailResponse)
def update_quiz_endpoint(
    quiz_id: str,
    data: QuizUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.creator_id != current_user.id and current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Not your quiz")
    quiz = update_quiz(db, quiz_id, data)
    return _quiz_to_detail(quiz)


@router.delete("/{quiz_id}")
def delete_quiz_endpoint(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.creator_id != current_user.id and current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Not your quiz")
    delete_quiz(db, quiz_id)
    return {"message": "Quiz deleted successfully"}


@router.post("/{quiz_id}/duplicate", response_model=QuizDetailResponse)
def duplicate_quiz_endpoint(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["teacher", "administrator"]:
        raise HTTPException(status_code=403, detail="Only teachers can duplicate quizzes")
    quiz = duplicate_quiz(db, quiz_id, current_user.id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return _quiz_to_detail(quiz)


@router.post("/{quiz_id}/play")
def play_quiz(quiz_id: str, db: Session = Depends(get_db)):
    increment_play_count(db, quiz_id)
    return {"message": "Play count incremented"}


def _quiz_to_detail(quiz: Quiz) -> QuizDetailResponse:
    questions = [
        QuestionResponse(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            question_type=q.question_type,
            explanation=q.explanation,
            image_url=q.image_url,
            order=q.order,
            points=q.points,
            time_limit=q.time_limit,
            choices=[
                {"id": c.id, "choice_text": c.choice_text, "is_correct": c.is_correct, "order": c.order}
                for c in q.choices
            ],
        )
        for q in quiz.questions
    ]
    return QuizDetailResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        image_url=quiz.image_url,
        is_public=quiz.is_public,
        difficulty=quiz.difficulty,
        category_id=quiz.category_id,
        creator_id=quiz.creator_id,
        creator_name=quiz.creator.username,
        time_per_question=quiz.time_per_question,
        points_per_question=quiz.points_per_question,
        randomize_questions=quiz.randomize_questions,
        randomize_answers=quiz.randomize_answers,
        play_count=quiz.play_count,
        likes=quiz.likes,
        question_count=len(quiz.questions),
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        questions=questions,
    )


def _quiz_to_list(quiz: Quiz) -> QuizListResponse:
    return QuizListResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        image_url=quiz.image_url,
        difficulty=quiz.difficulty,
        is_public=quiz.is_public,
        category_name=quiz.category.name if quiz.category else None,
        creator_name=quiz.creator.username,
        question_count=len(quiz.questions),
        play_count=quiz.play_count,
        likes=quiz.likes,
        created_at=quiz.created_at,
    )
