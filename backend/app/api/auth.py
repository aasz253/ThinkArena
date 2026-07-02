from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Profile
from app.schemas.auth import (
    LoginRequest, RegisterRequest, Token, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.services.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.models.log import Log

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id, display_name=user.username)
    db.add(profile)

    db.add(Log(user_id=user.id, action="register", resource="user", resource_id=user.id))
    db.commit()

    return {
        "message": "User registered successfully",
        "user": {"id": user.id, "email": user.email, "username": user.username, "role": user.role},
    }


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is deactivated")

    db.add(Log(user_id=user.id, action="login", resource="user", resource_id=user.id))
    db.commit()

    return Token(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
    )


@router.post("/refresh", response_model=Token)
def refresh(token_data: dict, db: Session = Depends(get_db)):
    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        payload = decode_token(refresh_token)
        user = db.query(User).filter(User.id == payload.sub).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return Token(
            access_token=create_access_token(user.id, user.role),
            refresh_token=create_refresh_token(user.id, user.role),
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(Log(user_id=current_user.id, action="logout", resource="user", resource_id=current_user.id))
    db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    profile = current_user.profile
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "profile": {
            "display_name": profile.display_name if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "bio": profile.bio if profile else None,
            "xp": profile.xp if profile else 0,
            "level": profile.level if profile else 1,
            "games_played": profile.games_played if profile else 0,
            "games_hosted": profile.games_hosted if profile else 0,
            "quizzes_created": profile.quizzes_created if profile else 0,
            "total_score": profile.total_score if profile else 0,
            "highest_score": profile.highest_score if profile else 0,
            "accuracy": profile.accuracy if profile else 0.0,
        } if profile else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        reset_token = create_access_token(user.id, user.role)
        db.add(Log(user_id=user.id, action="forgot_password", resource="user", resource_id=user.id))
        db.commit()
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.token)
        user = db.query(User).filter(User.id == payload.sub).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.hashed_password = hash_password(data.password)
        db.add(Log(user_id=user.id, action="reset_password", resource="user", resource_id=user.id))
        db.commit()
        return {"message": "Password reset successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
