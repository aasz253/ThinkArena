# ThinkArena

> Learn. Play. Compete.

An AI-powered, real-time quiz platform — a modern, production-quality alternative to Kahoot.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, shadcn/ui  
**Backend:** Python, FastAPI, SQLAlchemy, WebSockets, JWT Auth  
**Database:** PostgreSQL (Neon) / SQLite (dev)  
**AI:** Google Gemini API, OpenRouter  
**Deployment:** Vercel (frontend), Render (backend), Neon (database)

## Features

### Quizzes
- Create/edit/delete/duplicate quizzes
- 5 question types: Multiple Choice, True/False, Checkbox, Fill-in-Blank, Short Answer
- Categories, tags, difficulty levels, timers, scoring
- Public/private visibility

### Live Games
- Real-time WebSocket-powered game engine
- Host game with 6-digit PIN
- Players join via PIN with nickname
- Live leaderboard, countdown timer, instant feedback
- Scoring with time bonus, streak bonus, combo bonus

### AI Integration
- AI quiz generation from topic
- AI question generation
- AI explanations for answers
- AI study assistant & tutor
- AI difficulty recommendation

### Profiles & Gamification
- XP, levels, achievements, badges
- Global leaderboard
- Game history & analytics
- Avatar & profile customization

### Security
- JWT authentication with refresh tokens
- bcrypt password hashing
- Rate limiting, SQL injection protection
- XSS protection, secure headers
- Role-based access (Student, Teacher, Admin)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL or SQLite

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env with your settings
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment

### Backend (Render)
1. Create a new Web Service on Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add environment variables from `.env`

### Frontend (Vercel)
1. Import project to Vercel
2. Set framework: Vite
3. Add env variable `VITE_API_URL` pointing to your Render backend

### Database (Neon)
1. Create a Neon PostgreSQL database
2. Copy connection string to `DATABASE_URL` in backend env

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
thinkarena/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── websocket/    # WebSocket manager
│   │   └── middleware/   # Security middleware
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom hooks
│       ├── contexts/     # React contexts
│       └── lib/          # API client, utils
└── .github/workflows/    # CI/CD
```

## License

MIT
