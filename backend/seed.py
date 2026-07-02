from app.database import SessionLocal, engine, Base
from app.models.user import User, Profile
from app.services.auth import hash_password
import uuid


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Remove any other admin accounts
        others = db.query(User).filter(
            User.role == "administrator",
            User.email != "www.antonysifuna07@gmail.com"
        ).all()
        for u in others:
            db.delete(u)
            print(f"Removed old admin: {u.email}")

        # Create or update the default admin
        existing = db.query(User).filter(User.email == "www.antonysifuna07@gmail.com").first()
        if existing:
            existing.hashed_password = hash_password("ThinkArena@2026")
            existing.role = "administrator"
            existing.is_active = True
            existing.is_verified = True
            if not existing.profile:
                existing.profile = Profile(id=str(uuid.uuid4()), display_name="Admin")
            print("Admin user updated.")
        else:
            admin = User(
                id=str(uuid.uuid4()),
                email="www.antonysifuna07@gmail.com",
                username="admin",
                hashed_password=hash_password("ThinkArena@2026"),
                role="administrator",
                is_active=True,
                is_verified=True,
            )
            admin.profile = Profile(id=str(uuid.uuid4()), display_name="Admin")
            db.add(admin)
            print("Admin user created.")
        db.commit()
        print("Default admin: www.antonysifuna07@gmail.com / ThinkArena@2026")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
