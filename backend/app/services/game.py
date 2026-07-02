from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from app.models.game import Game, Player, Answer, LeaderboardEntry
from app.models.quiz import Quiz, Question
from app.services.quiz import increment_play_count
import random
import string


def generate_pin() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_game(db: Session, quiz_id: str, host_id: str) -> Game:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise ValueError("Quiz not found")

    pin = generate_pin()
    while db.query(Game).filter(Game.pin == pin, Game.status.in_(["waiting", "live"])).first():
        pin = generate_pin()

    game = Game(
        quiz_id=quiz_id,
        host_id=host_id,
        pin=pin,
        total_questions=len(quiz.questions),
        status="waiting",
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


def get_game_by_pin(db: Session, pin: str) -> Optional[Game]:
    return db.query(Game).filter(Game.pin == pin).first()


def get_game(db: Session, game_id: str) -> Optional[Game]:
    return db.query(Game).filter(Game.id == game_id).first()


def join_game(db: Session, game_pin: str, nickname: str, user_id: Optional[str] = None) -> Player:
    game = get_game_by_pin(db, game_pin)
    if not game:
        raise ValueError("Game not found")
    if game.status != "waiting":
        raise ValueError("Game has already started")

    player = Player(
        game_id=game.id,
        user_id=user_id,
        nickname=nickname,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


def start_game(db: Session, game_id: str) -> Game:
    game = get_game(db, game_id)
    if not game:
        raise ValueError("Game not found")
    game.status = "live"
    game.current_question = 0
    game.started_at = func.now()
    increment_play_count(db, game.quiz_id)
    db.commit()
    db.refresh(game)
    return game


def next_question(db: Session, game_id: str) -> Optional[Game]:
    game = get_game(db, game_id)
    if not game:
        return None
    game.current_question += 1
    if game.current_question >= game.total_questions:
        game.status = "finished"
        game.ended_at = func.now()
        _finalize_leaderboard(db, game)
    db.commit()
    db.refresh(game)
    return game


def submit_answer(
    db: Session,
    player_id: str,
    question_id: str,
    game_id: str,
    selected_choice_id: Optional[str] = None,
    answer_text: Optional[str] = None,
    time_taken: float = 0.0,
) -> Answer:
    from app.models.quiz import Choice
    from datetime import datetime, timezone

    is_correct = False
    points_earned = 0

    question = db.query(Question).filter(Question.id == question_id).first()
    player = db.query(Player).filter(Player.id == player_id).first()

    if not question or not player:
        raise ValueError("Question or player not found")

    if selected_choice_id:
        correct_choice = db.query(Choice).filter(
            Choice.question_id == question_id, Choice.is_correct == True
        ).first()
        is_correct = correct_choice and correct_choice.id == selected_choice_id
    elif answer_text:
        correct_choices = db.query(Choice).filter(
            Choice.question_id == question_id, Choice.is_correct == True
        ).all()
        is_correct = any(
            c.choice_text.lower().strip() == answer_text.lower().strip()
            for c in correct_choices
        )

    if is_correct:
        player.streak += 1
        if time_taken < 0.5:
            points_earned = question.points
        else:
            points_earned = round((1 - (time_taken / question.time_limit) / 2) * question.points)
        player.correct_count += 1
    else:
        player.streak = 0

    player.total_answered += 1
    player.score += points_earned

    if player.streak > player.game.host.profile.best_streak:
        pass

    answer = Answer(
        player_id=player_id,
        question_id=question_id,
        game_id=game_id,
        selected_choice_id=selected_choice_id,
        answer_text=answer_text,
        is_correct=is_correct,
        time_taken=time_taken,
        points_earned=points_earned,
        streak_bonus=0,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def _finalize_leaderboard(db: Session, game: Game):
    players = db.query(Player).filter(Player.game_id == game.id).order_by(desc(Player.score)).all()
    for i, player in enumerate(players):
        entry = LeaderboardEntry(
            game_id=game.id,
            player_id=player.id,
            score=player.score,
            correct_count=player.correct_count,
            total_questions=game.total_questions,
            rank=i + 1,
        )
        db.add(entry)
        if player.user_id:
            profile = player.user.profile
            if profile:
                profile.games_played += 1
                profile.total_score += player.score
                profile.correct_answers += player.correct_count
                profile.total_answers += player.total_answered
                if player.score > profile.highest_score:
                    profile.highest_score = player.score
                if i == 0:
                    profile.win_streak += 1
                else:
                    profile.win_streak = 0
                xp_gained = player.score // 10
                profile.xp += xp_gained
                profile.level = max(1, profile.xp // 1000 + 1)
    db.commit()


def get_game_results(db: Session, game_id: str) -> dict:
    game = get_game(db, game_id)
    if not game:
        raise ValueError("Game not found")
    leaderboard = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.game_id == game_id
    ).order_by(LeaderboardEntry.rank).all()
    return {
        "game_id": game.id,
        "quiz_title": game.quiz.title,
        "total_questions": game.total_questions,
        "started_at": game.started_at,
        "ended_at": game.ended_at,
        "players": [
            {
                "id": e.id,
                "player_id": e.player_id,
                "player_nickname": e.player.nickname,
                "score": e.score,
                "correct_count": e.correct_count,
                "total_questions": e.total_questions,
                "rank": e.rank,
            }
            for e in leaderboard
        ],
    }


def get_player_game_history(db: Session, user_id: str) -> List[dict]:
    player_entries = db.query(Player).filter(Player.user_id == user_id).all()
    history = []
    for p in player_entries:
        game = p.game
        leaderboard_entry = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.game_id == game.id,
            LeaderboardEntry.player_id == p.id,
        ).first()
        history.append({
            "id": game.id,
            "quiz_title": game.quiz.title,
            "pin": game.pin,
            "status": game.status,
            "player_count": len(game.players),
            "score": p.score,
            "rank": leaderboard_entry.rank if leaderboard_entry else None,
            "started_at": game.started_at,
            "created_at": game.created_at,
        })
    return sorted(history, key=lambda x: x["created_at"], reverse=True)


