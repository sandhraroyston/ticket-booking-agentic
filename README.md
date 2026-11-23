# Ticket Booking (agentic engineering project)

## Problem

Small venues (theatres, comedy clubs, community halls) need a simple way to sell reserved seats
online. Buyers should see a live seat map, hold seats while they pay, and never get a seat that
someone else already bought.

## Features (MVP)

- Sign up / log in (email + password, JWT)
- Browse upcoming events (name, venue, date, price range)
- Live seat map (available / held / sold)
- Hold up to 6 seats for 10 minutes, with automatic expiry
- Checkout with a fake payment step, which creates an order with a confirmation code
- "My orders" page
- Seed data: venues, events, seat maps

Double booking is prevented in the database (row locks + unique constraints), not only in code.

Out of scope: real payments, emails, refunds, multiple currencies.

## Run locally

> Available from phase 7. Until then, see `docs/plan.md` §13 for progress.

```bash
make up      # full stack: frontend, backend, postgres, otel-collector, grafana
make seed    # load demo data
make test    # all tests
```

## URLs

| Environment | App | Grafana |
|---|---|---|
| local | http://localhost:5173 | http://localhost:3000 |
| dev | _TBD (phase 9)_ | _TBD_ |
| prod | _TBD (phase 9)_ | _TBD_ |

## How it's built

Built by a team of Claude Code subagents (product-owner, backend-dev, frontend-dev, qa, devops,
sre-oncall) following a groom → implement → verify → ship workflow. See `AGENTS.md`,
`docs/agents.md` and `docs/process.md`.

## Rubric map

| Criterion | Where it is satisfied |
|---|---|
| Problem description | This README |
| Product spec + tracker | `docs/spec.md`, GitHub Project board, issues with acceptance criteria, PRs `Closes #N` |
| Agent team | `docs/agents.md`, `.claude/agents/`, `docs/process.md` |
| Context management | `AGENTS.md` linking modular `docs/` |
| Application | React + FastAPI + Postgres, `make up` |
| Testing | unit + integration, `make test` |
| Containerization | `docker-compose.yml`, one command |
| Deployment | public dev/prod URLs (above) |
| CI/CD | `ci.yml`, `cd-dev.yml`, `deploy-prod.yml` (manual) |
| Observability | OTel traces/metrics/logs sharing trace_id, Grafana, no PII |
| Alerting | Grafana alert on checkout errors/latency |
| On-call agent | `oncall.yml` + sre-oncall subagent |
