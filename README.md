# NanhiPathshala

NanhiPathshala is a Hindi-first AI voice tutor for Indian mothers and children. It helps with homework, explains concepts in simple language, supports photo-based questions, and replies in audio by default for voice-led conversations.

Built for Google Cloud Gen AI Academy Track 1 using Google ADK, Gemini on Vertex AI, Speech-to-Text, Text-to-Speech, and Cloud Run.

## Problem

Many Indian families, especially Hindi-first households, do not have access to a patient, always-available tutor. Existing tools are often English-heavy, text-heavy, or not designed for mothers helping children with daily homework on a phone.

NanhiPathshala focuses on a smaller but practical workflow:

- child asks a question by voice
- mother uploads a worksheet or homework photo if needed
- tutor answers in simple Hindi
- tutor asks a short follow-up question to reinforce learning
- mother gets a concise summary of what the child understood

## What It Does

- Hindi-first mobile experience with English switch
- Push-to-talk voice questions
- Automatic audio replies for voice-led questions
- Photo upload and camera capture for homework help
- Follow-up teaching questions after each answer
- Parent-friendly summary card
- Browser-only saved chat history for the MVP

## Why This Is A Real Agent

NanhiPathshala is not just a chatbot UI. The backend is a real Google ADK agent:

- single ADK `root_agent` in [`backend/nanhipathshala_agent/agent.py`](backend/nanhipathshala_agent/agent.py)
- Gemini on Vertex AI for tutoring and reasoning
- tool-based flows in [`backend/nanhipathshala_agent/tools.py`](backend/nanhipathshala_agent/tools.py)
- session-based tutoring state
- Cloud Run deployment path aligned to Track 1

## Stack

- Google Agent Development Kit (ADK)
- Vertex AI Gemini
- Google Cloud Speech-to-Text
- Google Cloud Text-to-Speech
- Cloud Run
- React + Vite frontend
- Express server for frontend hosting and Google API proxying

## Project Structure

- [`backend/`](backend): ADK agent service
- [`frontend/`](frontend): mobile-first voice tutor UI
- [`docs/`](docs): hackathon and demo assets
- [`scripts/`](scripts): deployment helpers for Cloud Run

## Local Setup

### 1. Backend

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp nanhipathshala_agent/.env.example nanhipathshala_agent/.env
```

Set these values in `backend/nanhipathshala_agent/.env`:

```env
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

Authenticate locally:

```bash
gcloud auth application-default login
```

Run the ADK app:

```bash
source .venv/bin/activate
adk api_server .
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

Run locally:

```bash
npm run build
node server.cjs
```

By default, the frontend expects the ADK API at `http://127.0.0.1:8001`.

## Deployment

Set your Google Cloud project and region, then use the included scripts:

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1

./scripts/deploy_backend.sh
export BACKEND_URL=https://your-backend-service-url
./scripts/deploy_frontend.sh
```

## Security Notes

- No API keys are stored in the frontend.
- Google Cloud auth is handled through Application Default Credentials or Cloud Run service accounts.
- Local `.env` files are gitignored.
- Deployment scripts require you to provide your own Google Cloud project settings.

## Submission Assets

- [`docs/track-fit.md`](docs/track-fit.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/submission-copy.md`](docs/submission-copy.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/submission-checklist.md`](docs/submission-checklist.md)
- [`docs/slides/NanhiPathshala-Submission-Deck.pptx`](docs/slides/NanhiPathshala-Submission-Deck.pptx)
