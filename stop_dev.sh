#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

compose_file="docker-compose.dev.yml"

echo "Stopping frontend/backend processes (best effort)..."
pkill -f "uvicorn app.api.main:app" >/dev/null 2>&1 || true
pkill -f "npm run start" >/dev/null 2>&1 || true

echo "Bringing down docker compose stack..."
if command -v docker compose >/dev/null 2>&1; then
  docker compose -f "${compose_file}" down || true
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f "${compose_file}" down || true
else
  echo "docker compose not found; skipping compose shutdown."
fi

echo "Done."

