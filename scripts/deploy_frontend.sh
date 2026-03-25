#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project ID}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-nanhipathshala-web}"
BACKEND_URL="${BACKEND_URL:?Set BACKEND_URL to your deployed backend Cloud Run URL}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/nanhipathshala-web:latest"

gcloud builds submit "${REPO_ROOT}/frontend" \
  --tag "${IMAGE_URI}" \
  --project "${PROJECT_ID}"

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "ADK_API_BASE_URL=${BACKEND_URL},ADK_APP_NAME=nanhipathshala_agent,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},PROJECT_ID=${PROJECT_ID}"
