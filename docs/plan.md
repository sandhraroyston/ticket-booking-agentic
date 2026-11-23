# Project Plan: Ticket Booking (agentic engineering project)

This is the master plan for the project. Claude Code: read this fully before doing anything.
It is the source for README.md, AGENTS.md, docs/*, agent definitions and the GitHub backlog.

## 1. Problem

Small venues (theatres, comedy clubs, community halls) need a simple way to sell reserved seats
online. Buyers should see a live seat map, hold seats while they pay, and never get a seat that
someone else already bought.

## 2. Functionality (MVP)

- Sign up / log in (email + password, JWT).
- Browse upcoming events (name, venue, date, price range).
- View an event's seat map with live availability (available / held / sold).
- Hold up to 6 seats for 10 minutes. Holds expire automatically.
- Checkout with a fake payment step; creates an order and marks seats sold.
- "My orders" page with confirmation codes.
- Admin seed data: a few venues, events and seat maps.

Expected behaviour:
- Two users can never buy the same seat (enforced in the database, not only in code).
- Expired holds release seats.
- Checkout of an expired hold fails with a clear error.

Out of scope: real payments, emails, refunds, multiple currencies.

## 3. Key user journey (instrumented for observability)

browse events → open seat map → hold seats → checkout → confirmation

## 4. Tech stack

- Frontend: React + Vite + TypeScript, Tailwind CSS, TanStack Query, React Router.
  API client generated from `openapi.yaml`. Served by nginx in Docker.
- Backend: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic. Package manager: uv.
- Database: PostgreSQL 16.
- Contract: `openapi.yaml` at repo root is the source of truth; CI checks the backend matches it.
- Tests: pytest (unit), pytest + testcontainers Postgres (integration), Vitest + React Testing
  Library (frontend), Playwright (one end-to-end test of the key journey).
- Lint/type: ruff, mypy, eslint, tsc. Security scan: Semgrep.
- Containers: Docker Compose (frontend, backend, postgres, otel-collector, grafana/otel-lgtm).
- Telemetry: OpenTelemetry (traces, metrics, logs), JSON logs with trace_id/span_id.
- CI/CD: GitHub Actions; images on GHCR; dev auto-deploy; prod manual with approval.
- Later (bonus): Kubernetes (Helm, kind), LangGraph version of the on-call agent.

## 5. Data model

users(id, email, password_hash, created_at)
venues(id, name, city)
events(id, venue_id, name, starts_at, description)
seats(id, event_id, section, row, number, price_cents, status[available|held|sold])
reservations(id, user_id, event_id, expires_at, status[active|expired|converted])
reservation_seats(reservation_id, seat_id)  -- unique(seat_id) for active holds
orders(id, user_id, reservation_id, total_cents, confirmation_code, created_at)

Double booking prevention: row-level locks (SELECT ... FOR UPDATE) + unique constraints.

## 6. API (defined in openapi.yaml)

POST /auth/signup, POST /auth/login
GET  /events, GET /events/{id}, GET /events/{id}/seats
POST /reservations            (hold seats)
DELETE /reservations/{id}     (release)
POST /checkout                (convert reservation to order)
GET  /orders/me
GET  /healthz, GET /readyz

## 7. Agent team (Claude Code subagents in .claude/agents/)

| Agent | Responsibility | May not |
|---|---|---|
| product-owner | Writes/grooms GitHub issues: goal, acceptance criteria, out of scope, test plan | Write code |
| backend-dev | FastAPI, DB, migrations, unit tests, keeps openapi.yaml in sync | Touch frontend, CI |
| frontend-dev | React UI, generated API client, component tests | Touch backend |
| qa | Independent verification of PRs against acceptance criteria, integration + e2e tests, posts verdict on PR | Merge |
| devops | Docker, Compose, CI/CD, deployment, Grafana provisioning | Change app logic |
| sre-oncall | Woken by alerts; investigates telemetry, opens incident issue and fix PR | Deploy to prod |

## 8. Workflow (docs/process.md)

Separate sessions for grooming, implementation and verification. The agent that builds never
verifies its own work.

1. `/groom <issue>`: product-owner makes the issue ready (label `ready`).
2. `/clear` then `/implement <issue>`: branch linked to issue (`gh issue develop`), code + tests,
   small commits `feat(scope): msg (refs #N)`, push, open PR with `Closes #N`. Never merge.
3. `/clear` then `/verify <pr>`: qa checks out the PR fresh, runs `make test`, checks each
   acceptance criterion, posts APPROVE / CHANGES NEEDED as a PR comment.
4. Human reviews diff + QA verdict, then `/ship <pr>` (squash auto-merge after CI is green).
5. Merge to main → CD deploys to dev automatically. Prod deploy is manual with approval.

Git rules: never commit/push to main; one issue = one branch = one PR; branch name
`<type>/<issue>-<slug>`; Conventional Commits; never force-push; use `gh` for GitHub actions.

Parallel work: independent issues run in separate git worktrees (`git worktree add ../tb-<N> -b <branch>`),
each with its own Claude session and its own COMPOSE_PROJECT_NAME/ports. Max 3 at a time. Remove
worktrees after merge.

## 9. Observability

- OpenTelemetry auto-instrumentation for FastAPI, SQLAlchemy and the browser (trace context
  propagated from frontend to backend).
- Structured JSON logs containing trace_id and span_id.
- Metrics: bookings_total, checkout_failures_total, checkout_duration_seconds (histogram),
  seat_hold_expired_total.
- Privacy: never send emails, passwords, tokens or payment data to telemetry. A scrubber
  processor enforces this; documented in docs/observability.md.
- Grafana (otel-lgtm locally, Grafana Cloud for deployed envs) with a provisioned
  "Booking journey" dashboard linking metrics → traces → logs.

## 10. Alerting and on-call agent

- Alert: checkout error rate > 5% for 5 min, or checkout p95 > 2s.
- Contact point: webhook → GitHub `repository_dispatch` → `oncall.yml` workflow.
- `oncall.yml` runs Claude Code headless with the sre-oncall subagent, the Grafana MCP server
  and the GitHub MCP server: opens an incident issue, queries traces/logs, finds root cause,
  opens a fix PR with a regression test, links PR to incident.
- Demo: merge a seeded bug, generate traffic with a load script, record alert → fix PR → deploy.

## 11. CI/CD

- `ci.yml` (every PR): lint, type-check, Semgrep, unit + integration + frontend tests,
  OpenAPI contract check, build images.
- Placeholder CI (bootstrap decision): the main ruleset requires the `ci` status check, and a
  required check that never runs would block every PR. So bootstrap creates a placeholder
  `.github/workflows/ci.yml` (on `pull_request` and `push` to main) with one job named exactly
  `ci` that checks out the code and echoes "CI placeholder OK". It is pushed to main before the
  ruleset is created. As soon as backend/ and frontend/ exist (phases 2–4), replace the echo
  with real lint and test steps in the same `ci` job. Don't wait for phase 9. Never rename the
  job: the ruleset depends on the name `ci`. Phase 9 then adds the remaining steps.
- `cd-dev.yml` (push to main): build + push images to GHCR, deploy to dev.
- `deploy-prod.yml` (manual workflow_dispatch, GitHub environment `production` with required
  approval): deploy the chosen image tag to prod.
- Hosting: one small cloud VM running Docker Compose with separate dev and prod stacks
  (deploy over SSH from Actions). Public URLs documented in README.

## 12. Repository layout

```
CLAUDE.md                 (contains: @AGENTS.md)
AGENTS.md                 (overview, commands, rules, links to docs/)
README.md                 (problem, features, run locally, URLs, rubric map)
openapi.yaml
Makefile                  (make up, make down, make test, make lint, make seed, make load)
docker-compose.yml
backend/  frontend/  mcp-server/  infra/ (grafana, otel-collector, deploy)  scripts/
docs/ spec.md architecture.md agents.md process.md observability.md security.md
      ai-workflow.md runbooks/checkout-errors.md
.github/ ISSUE_TEMPLATE/task.yml  pull_request_template.md  workflows/
.claude/ settings.json  agents/*.md  commands/groom.md implement.md verify.md ship.md
.mcp.json                 (github, grafana)
```

## 13. Phases (each becomes one or more GitHub issues)

0. Bootstrap: repo, settings, labels, project board, context files (this plan → docs).
1. Spec + backlog: user stories in docs/spec.md, issues with acceptance criteria.
2. Frontend prototype with mock data.
3. OpenAPI contract.
4. Backend + database + migrations + seed data.
5. Connect frontend to backend.
6. Tests: unit, integration (incl. double-booking test), frontend, e2e; `make test`.
7. Docker Compose full stack; `make up`.
8. Observability + dashboard.
9. CI, CD to dev, manual prod deploy; public URLs.
10. Alert + webhook.
11. On-call agent + seeded-bug demo.
12. Own MCP server for the app (list_events, seat_availability, order_status).
13. Bonus: Kubernetes, LangGraph on-call agent.

## 14. Rubric mapping

| Criterion | Where it is satisfied |
|---|---|
| Problem description | README.md |
| Product spec + tracker | docs/spec.md + public GitHub Project, issues with acceptance criteria, PRs `Closes #N` |
| Agent team | docs/agents.md + .claude/agents/ + docs/process.md |
| Context management | AGENTS.md linking modular docs/ |
| Application | React + FastAPI + Postgres, `make up` |
| Testing | unit + integration, `make test` |
| Containerization | docker-compose.yml, one command |
| Deployment | public dev/prod URLs |
| CI/CD | ci.yml, cd-dev.yml, deploy-prod.yml (manual) |
| Observability | OTel traces/metrics/logs sharing trace_id, Grafana UI, no PII |
| Alerting | Grafana alert on checkout errors/latency |
| On-call agent | oncall.yml + sre-oncall subagent |

## 15. Bootstrap tasks for Claude Code (first session)

1. `git init`, create `.gitignore`, then `gh repo create ticket-booking-agentic --public --source=. --remote=origin`.
2. Write all context files from this plan: README.md, CLAUDE.md, AGENTS.md, docs/*,
   .claude/agents/*, .claude/commands/*, .claude/settings.json, .github templates, .mcp.json,
   and the placeholder `.github/workflows/ci.yml` (job `ci`, see section 11).
3. Commit and push to main (the only direct push allowed, before rules exist). Wait for the
   first `ci` run to pass so the check exists.
4. With `gh api`: enable auto-merge, delete-branch-on-merge, squash merges; add a ruleset on main
   requiring PRs and the `ci` status check, blocking force pushes (no required approvals: solo developer).
5. Create labels (feature, bug, chore, docs, infra, ready, incident).
6. Create a public GitHub Project board linked to the repo.
7. Product-owner subagent: create issues for phases 1–12 using the task template, add them to the board.
   Show the list to the human before creating.
8. Stop and summarise what was done and what the human must do manually.
