#!/usr/bin/env bash
# Deploy Brewmate to Cloud Run on project builder-pop-uop.
# Usage: ./deploy.sh   (requires: gcloud auth login, and a GEMINI_API_KEY secret)
set -euo pipefail

PROJECT="builder-pop-uop"
REGION="${REGION:-us-central1}"
SERVICE="brewmate"
SECRET="gemini-api-key"

echo "==> Enabling required services on ${PROJECT}"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com --project "${PROJECT}"

# Create the secret once (ignore error if it already exists), then prompt to add a version.
if ! gcloud secrets describe "${SECRET}" --project "${PROJECT}" >/dev/null 2>&1; then
  echo "==> Creating secret ${SECRET} (add your key as a version next)"
  gcloud secrets create "${SECRET}" --replication-policy=automatic --project "${PROJECT}"
  echo "    Add your key with:"
  echo "    echo -n 'YOUR_GEMINI_KEY' | gcloud secrets versions add ${SECRET} --data-file=- --project ${PROJECT}"
fi

echo "==> Deploying ${SERVICE} from source"
gcloud run deploy "${SERVICE}" \
  --source . \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_MODEL=gemini-1.5-flash \
  --set-secrets "GEMINI_API_KEY=${SECRET}:latest"

echo "==> Done. Service URL:"
gcloud run services describe "${SERVICE}" --project "${PROJECT}" --region "${REGION}" \
  --format='value(status.url)'
