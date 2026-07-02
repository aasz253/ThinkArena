from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, Set, Optional
from app.services.game import submit_answer, next_question, start_game, get_game
from app.database import SessionLocal
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        self.host_connections: Dict[str, WebSocket] = {}
        self.player_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.player_nicknames: Dict[str, Dict[str, str]] = {}

    async def connect_host(self, game_id: str, websocket: WebSocket):
        await websocket.accept()
        self.host_connections[game_id] = websocket

    async def connect_player(self, game_id: str, player_id: str, nickname: str, websocket: WebSocket):
        await websocket.accept()
        if game_id not in self.player_connections:
            self.player_connections[game_id] = {}
            self.player_nicknames[game_id] = {}
        self.player_connections[game_id][player_id] = websocket
        self.player_nicknames[game_id][player_id] = nickname
        await self.broadcast_player_count(game_id)

    async def disconnect_host(self, game_id: str):
        if game_id in self.host_connections:
            del self.host_connections[game_id]

    async def disconnect_player(self, game_id: str, player_id: str):
        if game_id in self.player_connections:
            self.player_connections[game_id].pop(player_id, None)
            self.player_nicknames[game_id].pop(player_id, None)
            await self.broadcast_player_count(game_id)

    async def send_to_host(self, game_id: str, message: dict):
        if game_id in self.host_connections:
            try:
                await self.host_connections[game_id].send_json(message)
            except Exception:
                pass

    async def send_to_player(self, game_id: str, player_id: str, message: dict):
        if game_id in self.player_connections and player_id in self.player_connections[game_id]:
            try:
                await self.player_connections[game_id][player_id].send_json(message)
            except Exception:
                pass

    async def broadcast_to_players(self, game_id: str, message: dict):
        if game_id in self.player_connections:
            disconnected = []
            for pid, ws in self.player_connections[game_id].items():
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.append(pid)
            for pid in disconnected:
                await self.disconnect_player(game_id, pid)

    async def broadcast_player_count(self, game_id: str):
        count = len(self.player_connections.get(game_id, {}))
        nicknames = list(self.player_nicknames.get(game_id, {}).values())
        await self.send_to_host(game_id, {
            "type": "player_count",
            "count": count,
            "players": nicknames,
        })

    def get_player_count(self, game_id: str) -> int:
        return len(self.player_connections.get(game_id, {}))


manager = ConnectionManager()


async def handle_host_connection(game_id: str, websocket: WebSocket):
    await manager.connect_host(game_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "start_game":
                db = SessionLocal()
                try:
                    game = start_game(db, game_id)
                    questions = game.quiz.questions
                    questions_data = []
                    for q in questions:
                        choices_data = [
                            {"id": c.id, "choice_text": c.choice_text, "order": c.order}
                            for c in q.choices
                        ]
                        questions_data.append({
                            "id": q.id,
                            "question_text": q.question_text,
                            "question_type": q.question_type,
                            "choices": choices_data,
                            "points": q.points,
                            "time_limit": q.time_limit,
                            "order": q.order,
                        })
                    await manager.send_to_host(game_id, {
                        "type": "game_started",
                        "total_questions": game.total_questions,
                    })
                    await manager.broadcast_to_players(game_id, {
                        "type": "game_started",
                        "total_questions": game.total_questions,
                    })
                    await asyncio.sleep(1)
                    await manager.send_to_host(game_id, {
                        "type": "question",
                        "question_index": 0,
                        "question": questions_data[0],
                        "total_questions": game.total_questions,
                    })
                    await manager.broadcast_to_players(game_id, {
                        "type": "question",
                        "question_index": 0,
                        "question": {k: v for k, v in questions_data[0].items() if k != "choices"},
                        "total_questions": game.total_questions,
                    })
                finally:
                    db.close()

            elif action == "pause":
                await manager.send_to_host(game_id, {"type": "paused"})
                await manager.broadcast_to_players(game_id, {"type": "paused", "message": "Host paused the game for explanation"})

            elif action == "resume":
                await manager.send_to_host(game_id, {"type": "resumed"})
                await manager.broadcast_to_players(game_id, {"type": "resumed"})

            elif action == "next_question":
                db = SessionLocal()
                try:
                    game = next_question(db, game_id)
                    if game.status == "finished":
                        await manager.send_to_host(game_id, {"type": "game_finished"})
                        await manager.broadcast_to_players(game_id, {"type": "game_finished"})
                    else:
                        questions = game.quiz.questions
                        q = questions[game.current_question]
                        choices_data = [
                            {"id": c.id, "choice_text": c.choice_text, "order": c.order}
                            for c in q.choices
                        ]
                        question_data = {
                            "id": q.id,
                            "question_text": q.question_text,
                            "question_type": q.question_type,
                            "choices": choices_data,
                            "points": q.points,
                            "time_limit": q.time_limit,
                            "order": q.order,
                        }
                        await manager.send_to_host(game_id, {
                            "type": "question",
                            "question_index": game.current_question,
                            "question": question_data,
                            "total_questions": game.total_questions,
                        })
                        await manager.broadcast_to_players(game_id, {
                            "type": "question",
                            "question_index": game.current_question,
                            "question": {k: v for k, v in question_data.items() if k != "choices"},
                            "total_questions": game.total_questions,
                        })
                finally:
                    db.close()

            elif action == "show_results":
                db = SessionLocal()
                try:
                    game = get_game(db, game_id)
                    leaderboard = db.query(LeaderboardEntry).filter(
                        LeaderboardEntry.game_id == game_id
                    ).order_by(LeaderboardEntry.rank).all()
                    results = [
                        {"rank": e.rank, "nickname": e.player.nickname, "score": e.score,
                         "correct_count": e.correct_count, "total": e.total_questions}
                        for e in leaderboard
                    ]
                    await manager.broadcast_to_players(game_id, {
                        "type": "final_results",
                        "results": results,
                    })
                    await manager.send_to_host(game_id, {
                        "type": "final_results",
                        "results": results,
                    })
                finally:
                    db.close()

            elif action == "kick_player":
                player_id = data.get("player_id")
                if player_id:
                    await manager.send_to_player(game_id, player_id, {
                        "type": "kicked",
                        "message": "You have been removed from the game by the host.",
                    })

    except WebSocketDisconnect:
        await manager.disconnect_host(game_id)
    except Exception as e:
        await manager.disconnect_host(game_id)


async def handle_player_connection(game_id: str, player_id: str, nickname: str, websocket: WebSocket):
    await manager.connect_player(game_id, player_id, nickname, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "submit_answer":
                db = SessionLocal()
                try:
                    answer = submit_answer(
                        db=db,
                        player_id=player_id,
                        question_id=data["question_id"],
                        game_id=game_id,
                        selected_choice_id=data.get("selected_choice_id"),
                        answer_text=data.get("answer_text"),
                        time_taken=data.get("time_taken", 0),
                    )
                    player = db.query(Player).filter(Player.id == player_id).first()
                    await manager.send_to_player(game_id, player_id, {
                        "type": "answer_result",
                        "is_correct": answer.is_correct,
                        "points_earned": answer.points_earned,
                        "streak_bonus": answer.streak_bonus,
                        "total_score": player.score,
                        "correct_answer_id": data.get("correct_answer_id"),
                    })
                    db_game = get_game(db, game_id)
                    all_players = db.query(Player).filter(
                        Player.game_id == game_id
                    ).order_by(Player.score.desc()).all()
                    leaderboard_snapshot = [
                        {"player_id": p.id, "nickname": p.nickname, "score": p.score,
                         "correct_count": p.correct_count}
                        for p in all_players
                    ]
                    await manager.send_to_host(game_id, {
                        "type": "leaderboard_update",
                        "leaderboard": leaderboard_snapshot,
                    })
                finally:
                    db.close()

    except WebSocketDisconnect:
        await manager.disconnect_player(game_id, player_id)
    except Exception:
        await manager.disconnect_player(game_id, player_id)


from app.models.game import Player, LeaderboardEntry
