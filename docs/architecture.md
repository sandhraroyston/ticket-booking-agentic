# Architecture

## Components

```
Browser (React SPA, OTel web SDK)
   │  HTTPS + traceparent
   ▼
nginx (serves frontend, proxies /api) ──► FastAPI backend (OTel auto-instrumented)
                                             │ SQLAlchemy 2
                                             ▼
                                         PostgreSQL 16
Backend + browser ──OTLP──► otel-collector (PII scrubber) ──► Grafana LGTM / Grafana Cloud
```

- **Frontend**: React + Vite + TypeScript, Tailwind, TanStack Query, React Router. API client
  generated from `openapi.yaml`.
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic; managed with uv.
- **Database**: PostgreSQL 16.
- **Contract**: `openapi.yaml` at repo root is the source of truth. CI checks the backend matches it.

## Data model

```
users(id, email, password_hash, created_at)
venues(id, name, city)
events(id, venue_id, name, starts_at, description)
seats(id, event_id, section, row, number, price_cents, status[available|held|sold])
reservations(id, user_id, event_id, expires_at, status[active|expired|converted])
reservation_seats(reservation_id, seat_id)   -- unique(seat_id) for active holds
orders(id, user_id, reservation_id, total_cents, confirmation_code, created_at)
```

### Double-booking prevention

1. `POST /reservations` opens a transaction and runs `SELECT ... FROM seats WHERE id IN (...) FOR UPDATE`.
2. It rejects the request if any seat is not `available` (or is held by an expired reservation, which is released first).
3. It inserts `reservation_seats`. The unique constraint on `seat_id` (for active holds) is the last line of defence.
4. Checkout locks the reservation row, checks `expires_at > now()` and `status = active`, marks seats `sold`, and creates the order.

### Hold expiry

Expired holds are released lazily when seats are read or held, and also by a periodic sweeper.
Either path increments `seat_hold_expired_total`.

## API

Defined in `openapi.yaml`:

```
POST   /auth/signup, /auth/login
GET    /events, /events/{id}, /events/{id}/seats
POST   /reservations          hold seats
DELETE /reservations/{id}     release
POST   /checkout              reservation → order
GET    /orders/me
GET    /healthz, /readyz
```

## Repository layout

```
openapi.yaml  Makefile  docker-compose.yml
backend/  frontend/  mcp-server/  infra/ (grafana, otel-collector, deploy)  scripts/
docs/  .github/  .claude/  .mcp.json
```
