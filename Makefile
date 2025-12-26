.PHONY: help setup up down logs init-db clean dev-up dev-down dev-logs

help:
	@echo "DocuForms - Available commands:"
	@echo ""
	@echo "Full Stack (all services in Docker):"
	@echo "  make setup     - Copy .env.example to .env"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs from all services"
	@echo "  make init-db   - Initialize database tables"
	@echo "  make clean     - Remove all containers and volumes"
	@echo ""
	@echo "Development (services only, run backend/frontend locally):"
	@echo "  make dev-up    - Start PostgreSQL and Keycloak only"
	@echo "  make dev-down  - Stop PostgreSQL and Keycloak"
	@echo "  make dev-logs  - View logs from dev services"

setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please update it with your values."; \
	else \
		echo ".env file already exists."; \
	fi

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

init-db:
	docker compose exec backend python init_db.py

clean:
	docker compose down -v
	docker compose rm -f

# Development commands (services only)
dev-up:
	docker compose -f docker compose.dev.yml up -d

dev-down:
	docker compose -f docker compose.dev.yml down

dev-logs:
	docker compose -f docker compose.dev.yml logs -f

