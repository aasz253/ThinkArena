from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.game import Game, Player
from app.schemas.game import (
    GameCreate, GameResponse, PlayerJoin, PlayerResponse,
    AnswerSubmit, AnswerResponse, GameResults, GameHistoryResponse,
)
from app.services.auth import get_current_user
from app.services.game import (
    create_game, get_game, get_game_by_pin, join_game,
    start_game, get_game_results, get_player_game_history,
)
from app.websocket.game_manager import manager, handle_host_connection, handle_player_connection
from typing import List

router = APIRouter(prefix="/games", tags=["Games"])


@router.post("", response_model=GameResponse, status_code=201)
def create_game_endpoint(
    data: GameCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["teacher", "administrator"]:
        raise HTTPException(status_code=403, detail="Only teachers can host games")
    try:
        game = create_game(db, data.quiz_id, current_user.id)
        profile = current_user.profile
        if profile:
            profile.games_hosted += 1
            db.commit()
        return game
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/join", response_model=dict)
def join_game_endpoint(data: PlayerJoin, db: Session = Depends(get_db)):
    game = get_game_by_pin(db, data.game_pin)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.status != "waiting":
        raise HTTPException(status_code=400, detail="Game has already started")
    existing = db.query(Player).filter(
        Player.game_id == game.id, Player.nickname == data.nickname
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nickname already taken")
    player = join_game(db, data.game_pin, data.nickname)
    return {
        "player_id": player.id,
        "game_id": game.id,
        "pin": game.pin,
        "nickname": player.nickname,
    }


@router.get("/{game_id}", response_model=GameResponse)
def get_game_endpoint(game_id: str, db: Session = Depends(get_db)):
    game = get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/{game_id}/results", response_model=dict)
def get_results_endpoint(game_id: str, db: Session = Depends(get_db)):
    try:
        return get_game_results(db, game_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history/mine", response_model=List[dict])
def my_game_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_player_game_history(db, current_user.id)


@router.websocket("/ws/host/{game_id}")
async def host_websocket(websocket: WebSocket, game_id: str):
    await handle_host_connection(game_id, websocket)


@router.websocket("/ws/player/{game_id}/{player_id}")
async def player_websocket(websocket: WebSocket, game_id: str, player_id: str):
    nickname = ""
    db = next(get_db())
    player = db.query(Player).filter(Player.id == player_id).first()
    db.close()
    if player:
        nickname = player.nickname
    await handle_player_connection(game_id, player_id, nickname, websocket)
