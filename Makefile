# Targets are added as phases land (docs/plan.md section 13).
.PHONY: help install lint test api-lint db db-down \
	backend-install backend-lint backend-test \
	frontend-install frontend-lint frontend-test

FRONTEND_DIR := frontend
BACKEND_DIR := backend
REDOCLY_CLI := @redocly/cli@2.83.0

# Overridable so parallel checkouts don't clash, e.g.
#   make db COMPOSE_PROJECT_NAME=tb8 POSTGRES_PORT=55432
COMPOSE_PROJECT_NAME ?= ticket-booking
POSTGRES_PORT ?= 5432
export COMPOSE_PROJECT_NAME POSTGRES_PORT
COMPOSE := docker compose -f compose.yaml

help:
	@echo "make install  - install backend (uv sync) and frontend (npm ci) dependencies"
	@echo "make lint     - ruff + mypy (backend), eslint + tsc --noEmit (frontend)"
	@echo "make test     - pytest (backend), Vitest (frontend)"
	@echo "make db       - start Postgres 16 only (COMPOSE_PROJECT_NAME, POSTGRES_PORT overridable)"
	@echo "make db-down  - stop the Postgres container (data volume kept)"
	@echo "make api-lint - lint openapi.yaml with Redocly CLI (rules in redocly.yaml)"

install: backend-install frontend-install

lint: backend-lint frontend-lint

test: backend-test frontend-test

# Not part of `make lint` / CI yet: the CI contract check is issue #33.
api-lint:
	npx --yes $(REDOCLY_CLI) lint openapi.yaml

db:
	$(COMPOSE) up -d --wait db

db-down:
	$(COMPOSE) stop db

backend-install:
	cd $(BACKEND_DIR) && uv sync --locked

backend-lint:
	cd $(BACKEND_DIR) && uv run --locked ruff format --check .
	cd $(BACKEND_DIR) && uv run --locked ruff check .
	cd $(BACKEND_DIR) && uv run --locked mypy

backend-test:
	cd $(BACKEND_DIR) && uv run --locked pytest

frontend-install:
	cd $(FRONTEND_DIR) && npm ci

$(FRONTEND_DIR)/node_modules: $(FRONTEND_DIR)/package-lock.json
	cd $(FRONTEND_DIR) && npm ci
	@touch $@

frontend-lint: $(FRONTEND_DIR)/node_modules
	cd $(FRONTEND_DIR) && npm run lint
	cd $(FRONTEND_DIR) && npm run typecheck

frontend-test: $(FRONTEND_DIR)/node_modules
	cd $(FRONTEND_DIR) && npm test
