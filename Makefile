# Targets are added as phases land (docs/plan.md section 13).
.PHONY: help install lint test frontend-install frontend-lint frontend-test

FRONTEND_DIR := frontend

help:
	@echo "make install  - install frontend dependencies (npm ci)"
	@echo "make lint     - eslint + tsc --noEmit (frontend)"
	@echo "make test     - Vitest (frontend)"

install: frontend-install

lint: frontend-lint

test: frontend-test

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
