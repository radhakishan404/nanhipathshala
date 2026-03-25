# NanhiPathshala Frontend

Mobile-first Hindi UI for the NanhiPathshala MVP.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Voice Features

- Voice input uses the browser speech recognition API when available.
- Lesson playback uses the browser speech synthesis API.
- This keeps the demo lightweight while the Google-native Live API flow is being added.

## Backend Integration

Set these env vars in a `.env.local` file if you want the UI to call the ADK backend directly during local development:

```bash
VITE_ADK_API_BASE_URL=http://127.0.0.1:8001
VITE_ADK_APP_NAME=nanhipathshala_agent
```

Then start the backend from [backend/README.md](/Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/backend/README.md) and the frontend will use:

- `POST /apps/{app}/users/{user}/sessions`
- `POST /run`

If the env vars are not set, the UI falls back to local demo responses.

## Cloud Run Deployment

This frontend can also be deployed to Cloud Run with runtime-configured backend URLs.

Example deploy command:

```bash
gcloud run deploy nanhipathshala-web \
  --source /Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/frontend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ADK_API_BASE_URL=https://YOUR-BACKEND-URL,ADK_APP_NAME=nanhipathshala_agent
```
