# Ride Lanka Backend

Express REST API — manages user profiles, behavior tracking, and orchestrates AI recommendations.

## Architecture

```
Frontend  ──►  Backend (Node.js/Express)  ──►  AI Service (Python/FastAPI)
                      │                               │
                      ▼                               ▼
                 Firestore                        Gemini API
                                                Google Maps API
```

## Setup

```bash
cd Ride-lanka-backend
npm install
copy .env.example .env    # fill in values
```

## Environment variables

| Variable | How to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `FIREBASE_PRIVATE_KEY` | Same JSON file as above |
| `BACKEND_SECRET` | Any random string — must match `Ride-lanka-AI` |
| `AI_SERVICE_URL` | URL of the running AI service (default `http://localhost:8000`) |

## Run

```bash
npm run dev    # development (auto-restarts)
npm start      # production
```

## API Reference

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/profile` | ✅ | Save name + interests after signup |
| GET | `/api/users/profile` | ✅ | Fetch user profile |
| POST | `/api/users/recommendations/refresh` | ✅ | Ask AI for fresh top-5 recommendations |
| GET | `/api/users/recommendations` | ✅ | Get cached recommendations |

### Events (behavior queue)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/events` | ✅ | Track a user interaction |
| GET | `/api/events` | ✅ | View current 50-element queue |

### Track an event — POST `/api/events`

```json
{
  "place_name": "Sigiriya Rock Fortress",
  "category": "culture",
  "action": "view"
}
```

Valid **actions**: `view`, `save`, `book`, `search`  
Valid **categories**: `culture`, `nature`, `beach`, `wildlife`, `food`, `adventure`, `hiking`, `dance`, `general`

## 50-element behavior queue

Each user has a `behaviorQueue` array in Firestore (max 50 items).  
When the 51st event arrives, the oldest is automatically dropped (FIFO).  
This queue is passed to the AI service for personalized recommendations.

## Firestore data model

```
users/{uid}
  ├── uid: string
  ├── name: string
  ├── email: string
  ├── interests: string[]          # set at registration
  ├── behaviorQueue: Event[]       # max 50, FIFO
  ├── recommendations: Place[]     # last AI result
  └── recommendationsUpdatedAt: ISO timestamp
```
