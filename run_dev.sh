#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

compose_file="docker-compose.dev.yml"
backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${backend_pid}" ]] && ps -p "${backend_pid}" >/dev/null 2>&1; then
    kill "${backend_pid}" || true
  fi
  if [[ -n "${frontend_pid}" ]] && ps -p "${frontend_pid}" >/dev/null 2>&1; then
    kill "${frontend_pid}" || true
  fi
  if command -v docker compose >/dev/null 2>&1; then
    docker compose -f "${compose_file}" down >/dev/null 2>&1 || true
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "${compose_file}" down >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

# Bring up supporting services
if command -v docker compose >/dev/null 2>&1; then
  docker compose -f "${compose_file}" up -d
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f "${compose_file}" up -d
else
  echo "docker compose is required but not found." >&2
  exit 1
fi

# Activate conda env
if command -v conda >/dev/null 2>&1; then
  eval "$(conda shell.bash hook)"
  conda activate docuforms
else
  echo "conda not found in PATH." >&2
  exit 1
fi

# Export environment variables (DEV_SETUP.md)
export DATABASE_URL="postgresql://docuforms:changeme@localhost:5432/docuforms"
export KEYCLOAK_URL="http://localhost:8080"
export KEYCLOAK_REALM="docuforms"
export KEYCLOAK_CLIENT_ID="docuforms-client"

# Start backend
pushd backend >/dev/null
uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8000 &
backend_pid=$!
popd >/dev/null

# Start frontend
pushd frontend >/dev/null
npm run start &
frontend_pid=$!
popd >/dev/null

echo "Backend PID: ${backend_pid}"
echo "Frontend PID: ${frontend_pid}"
echo "Press Ctrl+C to stop everything."

wait "${backend_pid}" "${frontend_pid}"

