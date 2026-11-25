# Targets are added as phases land (docs/plan.md section 13).
.PHONY: help install lint test api-lint frontend-install frontend-lint frontend-test

FRONTEND_DIR := frontend
REDOCLY_CLI := @redocly/cli@2.83.0

help:
	@echo "make install  - install frontend dependencies (npm ci)"
	@echo "make lint     - eslint + tsc --noEmit (frontend)"
	@echo "make test     - Vitest (frontend)"
	@echo "make api-lint - lint openapi.yaml with Redocly CLI (rules in redocly.yaml)"

install: frontend-install

lint: frontend-lint

test: frontend-test

# Not part of `make lint` / CI yet: the CI contract check is issue #33.
api-lint:
	npx --yes $(REDOCLY_CLI) lint openapi.yaml

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
