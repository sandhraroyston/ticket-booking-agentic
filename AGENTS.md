# AGENTS.md

Entry point for AI agents (and humans) working on this repo. Keep this file short. Details
live in `docs/`, so load only the docs you need for the task.

## What this is

A reserved-seat ticket booking app for small venues: browse events, view a live seat map, hold
up to 6 seats for 10 minutes, check out with a fake payment, and see "My orders". Two users can
never buy the same seat (enforced in the database).

Stack: React + Vite + TypeScript (frontend), FastAPI + SQLAlchemy 2 + Alembic on Python 3.12 / uv
(backend), PostgreSQL 16, OpenTelemetry → Grafana, Docker Compose, GitHub Actions.

## Commands

| Command | What it does |
|---|---|
| `make up` / `make down` | Start / stop the full stack in Docker Compose |
| `make test` | All tests (unit, integration, frontend) |
| `make lint` | ruff, mypy, eslint, tsc, Semgrep |
| `make seed` | Load seed venues/events/seats |
| `make load` | Generate traffic for the key journey |

(Targets are added as phases land. See `docs/plan.md` §13.)

## Rules (non-negotiable)

- Branching: `develop` is the default and integration branch; `main` is production.
  Never commit or push directly to `develop` or `main`.
- Feature, fix and chore branches are cut from `develop` with
  `gh issue develop <N> --base develop --name <type>/<N>-<slug> --checkout` and merged back into
  `develop` by a **squash** PR. One issue = one branch = one PR (`Closes #N`).
- Releases are a PR from `develop` into `main`, merged with a **merge commit** (never squash).
  Merging to `develop` deploys to dev. Prod is deployed manually, with approval, from `main` only.
- Branch name: `<type>/<issue>-<slug>`, e.g. `feat/12-seat-hold`. Worktrees are created from `develop`.
- Conventional Commits: `feat(scope): msg (refs #N)`. Small commits. Never force-push.
- Use `gh` for every GitHub action.
- The agent that builds never verifies its own work (see `docs/process.md`).
- End every `/implement` and `/verify` session, and any session that stops midway, with a
  `Handoff:` comment on the issue (format in `docs/process.md`). Push work in progress first.
- Never merge your own PR. A human runs `/merge-pr` (not `/ship`, which is now a built-in that
  only reviews).
- `openapi.yaml` is the API source of truth. Change it first, then code.
- Never put emails, passwords, tokens or payment data in logs or telemetry.
- The CI job is named `ci` and is a required check. Never rename it. Whoever adds `backend/` or
  `frontend/` wires their lint and tests into that job.
- Ask before destructive or outward-facing actions (deploys, deleting data, prod).

## Docs map

| Need | Read |
|---|---|
| Full plan, phases, rubric | `docs/plan.md` |
| User stories, acceptance criteria | `docs/spec.md` |
| Components, data model, API | `docs/architecture.md` |
| Agent team and permissions | `docs/agents.md`, `.claude/agents/` |
| Groom → implement → verify → merge | `docs/process.md` (start a session with `/status`) |
| Run several issues in parallel | `docs/process.md` → Parallel work |
| Telemetry, dashboards, PII rules | `docs/observability.md` |
| Security practices | `docs/security.md` |
| How AI is used in this project | `docs/ai-workflow.md` |
| Checkout incident runbook | `docs/runbooks/checkout-errors.md` |
