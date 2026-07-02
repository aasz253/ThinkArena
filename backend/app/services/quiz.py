from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from app.models.quiz import Quiz, Question, Choice, Category, Tag, quiz_tags
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizUpdate, QuestionCreate


def create_quiz(db: Session, quiz_data: QuizCreate, creator_id: str) -> Quiz:
    quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        image_url=quiz_data.image_url,
        is_public=quiz_data.is_public,
        difficulty=quiz_data.difficulty,
        category_id=quiz_data.category_id,
        creator_id=creator_id,
        time_per_question=quiz_data.time_per_question,
        points_per_question=quiz_data.points_per_question,
        randomize_questions=quiz_data.randomize_questions,
        randomize_answers=quiz_data.randomize_answers,
    )
    db.add(quiz)
    db.flush()

    if quiz_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(quiz_data.tag_ids)).all()
        quiz.tags = tags

    for i, q_data in enumerate(quiz_data.questions):
        question = Question(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            explanation=q_data.explanation,
            image_url=q_data.image_url,
            order=q_data.order or i,
            points=q_data.points,
            time_limit=q_data.time_limit,
        )
        db.add(question)
        db.flush()

        for j, c_data in enumerate(q_data.choices):
            choice = Choice(
                question_id=question.id,
                choice_text=c_data.choice_text,
                is_correct=c_data.is_correct,
                order=c_data.order or j,
            )
            db.add(choice)

    db.commit()
    db.refresh(quiz)
    return quiz


def get_quiz(db: Session, quiz_id: str) -> Optional[Quiz]:
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def get_public_quizzes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Quiz]:
    query = db.query(Quiz).filter(Quiz.is_public == True)
    if category_id:
        query = query.filter(Quiz.category_id == category_id)
    if difficulty:
        query = query.filter(Quiz.difficulty == difficulty)
    if search:
        query = query.filter(Quiz.title.ilike(f"%{search}%"))
    return query.order_by(desc(Quiz.play_count)).offset(skip).limit(limit).all()


def get_user_quizzes(db: Session, user_id: str) -> List[Quiz]:
    return db.query(Quiz).filter(Quiz.creator_id == user_id).order_by(desc(Quiz.created_at)).all()


def update_quiz(db: Session, quiz_id: str, quiz_data: QuizUpdate) -> Optional[Quiz]:
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        return None
    update_data = quiz_data.model_dump(exclude_unset=True)
    if "tag_ids" in update_data:
        tags = db.query(Tag).filter(Tag.id.in_(update_data.pop("tag_ids"))).all()
        quiz.tags = tags
    for key, value in update_data.items():
        setattr(quiz, key, value)
    db.commit()
    db.refresh(quiz)
    return quiz


def delete_quiz(db: Session, quiz_id: str) -> bool:
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        return False
    db.delete(quiz)
    db.commit()
    return True


def duplicate_quiz(db: Session, quiz_id: str, new_creator_id: str) -> Optional[Quiz]:
    original = get_quiz(db, quiz_id)
    if not original:
        return None
    new_quiz = Quiz(
        title=f"{original.title} (Copy)",
        description=original.description,
        is_public=False,
        difficulty=original.difficulty,
        category_id=original.category_id,
        creator_id=new_creator_id,
        time_per_question=original.time_per_question,
        points_per_question=original.points_per_question,
    )
    db.add(new_quiz)
    db.flush()

    for question in original.questions:
        new_q = Question(
            quiz_id=new_quiz.id,
            question_text=question.question_text,
            question_type=question.question_type,
            explanation=question.explanation,
            order=question.order,
            points=question.points,
            time_limit=question.time_limit,
        )
        db.add(new_q)
        db.flush()
        for choice in question.choices:
            new_c = Choice(
                question_id=new_q.id,
                choice_text=choice.choice_text,
                is_correct=choice.is_correct,
                order=choice.order,
            )
            db.add(new_c)

    db.commit()
    db.refresh(new_quiz)
    return new_quiz


def get_categories(db: Session) -> List[Category]:
    return db.query(Category).all()


def create_category(db: Session, name: str, description: Optional[str] = None, icon: Optional[str] = None, color: Optional[str] = None) -> Category:
    category = Category(name=name, description=description, icon=icon, color=color)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_tags(db: Session) -> List[Tag]:
    return db.query(Tag).all()


def increment_play_count(db: Session, quiz_id: str):
    db.query(Quiz).filter(Quiz.id == quiz_id).update({Quiz.play_count: Quiz.play_count + 1})
    db.commit()
