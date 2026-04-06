# SHram — ShramSetu Worker Marketplace

ShramSetu is a full-stack marketplace connecting blue-collar workers with employers in India. It features job posting, AI-assisted matching, escrow-based payments, KYC verification, OTP authentication, and real-time chat.

## Project Structure

```
SHram/
├── backend/        # FastAPI (Python) REST API
├── frontend/       # React (CRACO) web application
└── memory/         # Project documentation and PRD
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- MongoDB (local or Atlas)

## Backend Setup

```bash
cd backend
cp .env.example .env          # Fill in secrets (see below)
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

API docs are auto-generated at `http://localhost:8000/docs` (Swagger UI) and `/redoc`.

### Required Environment Variables (backend)

| Variable | Description |
|---|---|
| `JWT_SECRET` | **Required.** Long random secret for signing JWT tokens. |
| `MONGO_URL` | MongoDB connection string (default: `mongodb://localhost:27017`) |
| `DB_NAME` | Database name (default: `shramsetu`) |
| `GEMINI_API_KEY` | Google Gemini AI key for AI features |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for OTP SMS |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key for subscription payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push notifications |
| `VAPID_PUBLIC_KEY` | VAPID public key for web push notifications |

Generate a strong JWT secret with:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## Frontend Setup

```bash
cd frontend
cp .env.example .env          # Set REACT_APP_BACKEND_URL if not using production API
npm install
npm start
```

The app runs at `http://localhost:3000`.

### Required Environment Variables (frontend)

| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Backend base URL (defaults to `https://api.shramsetu.in`) |
| `REACT_APP_VAPID_PUBLIC_KEY` | VAPID public key for push notification subscription |

## Running Tests

```bash
# Backend
cd backend
pip install -r requirements-dev.txt
pytest

# Frontend
cd frontend
npm test
```

## CI/CD

GitHub Actions workflows are configured in `.github/workflows/`:

- `backend-tests.yml` — runs Python tests on every push/PR
- `frontend-tests.yml` — runs JS tests and build check
- `lint.yml` — runs flake8 (Python) and ESLint (JS)

## Architecture Overview

```
Browser ──► React (CRACO) ──► FastAPI ──► MongoDB
                 │                  │
                 │              Gemini AI (job matching, chatbot)
                 │              Twilio (OTP/SMS)
                 │              Cloudinary (media)
                 │              Stripe (subscriptions)
                 └──► WebSocket ──► FastAPI (real-time chat)
```

## Security Notes

- **Never commit `.env` files.** Use `.env.example` as a template.
- The `JWT_SECRET` env var is **required** at startup; the server will refuse to start without it.
- File uploads are sanitised to prevent path traversal.
- Passwords are hashed with bcrypt.
