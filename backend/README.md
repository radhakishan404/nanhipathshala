# Backend

NanhiPathshala backend service built with Google ADK and Gemini on Vertex AI.

## Local Setup

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Local Development

Run the ADK web UI from the `backend/` directory:

```bash
source .venv/bin/activate
adk web .
```

The agent package is `nanhipathshala_agent`.

## Runtime Notes

- Uses Vertex AI through `.env` values inside `nanhipathshala_agent/`
- Default region is `us-central1`
- Designed as a low-cost MVP with a single root agent

Create a local env file from the example:

```bash
cp nanhipathshala_agent/.env.example nanhipathshala_agent/.env
```

## Cloud Run Deployment

This backend is a real ADK agent service and can be deployed to Cloud Run with the included [`Dockerfile`](Dockerfile).

Example deploy command:

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1

gcloud run deploy nanhipathshala-agent \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=1,GOOGLE_CLOUD_PROJECT="${PROJECT_ID}",GOOGLE_CLOUD_LOCATION="${REGION}"
```

After deploy, give the Cloud Run service account permission to call Vertex AI if needed:

- `Vertex AI User`

The backend exposes ADK endpoints such as:

- `POST /apps/{app}/users/{user}/sessions`
- `POST /run`
