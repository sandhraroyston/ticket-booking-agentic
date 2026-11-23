# Product spec

Status: draft. Phase 1 expands this into full user stories and GitHub issues.

## Users

- **Buyer**: browses events, holds seats, pays, views orders.
- **Admin** (MVP: seed data only): venues, events, seat maps.

## User stories

| ID | Story | Key acceptance criteria |
|---|---|---|
| US-1 | As a buyer I can sign up and log in with email + password | JWT issued on login; duplicate email rejected; password stored hashed |
| US-2 | As a buyer I can browse upcoming events | Shows name, venue, date, price range; past events hidden |
| US-3 | As a buyer I can see an event's seat map with live availability | Each seat shows available / held / sold; refreshes without reload |
| US-4 | As a buyer I can hold up to 6 seats for 10 minutes | >6 seats rejected; held seats unavailable to others; hold has `expires_at` |
| US-5 | Holds expire automatically | After 10 min, seats return to available; `seat_hold_expired_total` increments |
| US-6 | As a buyer I can check out a hold with a fake payment | Creates an order with a confirmation code; seats become sold |
| US-7 | Checkout of an expired hold fails clearly | 409/410 with a clear message; no order created |
| US-8 | As a buyer I can see my orders | Lists my orders with confirmation codes only |
| US-9 | Seed data exists | A few venues, events and seat maps via `make seed` |

## Invariants

- Two users can **never** buy the same seat. This is enforced in the database (row locks +
  unique constraints), not only in code, and covered by a concurrent integration test.
- Expired holds release seats.

## Decisions

Decided by the human on 2026-11-23 while the backlog was groomed. Issues link here instead of repeating these.

| # | Topic | Decision | Issues |
|---|---|---|---|
| Q1 | Checkout of an expired hold | **409** with error code `hold_expired` (shared `{code, message}` error schema) | #7, #17, #22 |
| Q2 | Seat limit / holds per user | Max **6 seats per reservation**; **one active hold per user per event** (a second hold for the same event gives 409 `active_hold_exists`; holds on other events are allowed) | #4, #14 |
| Q3 | JWT lifetime | **60 min** access token, configurable via env; no refresh token | #11, #20 |
| Q4 | Password rules | At least **8 characters**; no complexity rules | #5, #11 |
| Q5 | Hold expiry mechanism | Lazy release on reads/holds **plus** an in-process background sweeper every **30 s** (env-configurable). The release is **idempotent**: a conditional `UPDATE ... WHERE status = 'active' AND expires_at <= now()`, and seats are released only for rows that update changed. This keeps it safe when several app replicas run it (e.g. later on Kubernetes) | #16 |
| Q6 | Manual release status | New reservation status **`released`** (`active\|expired\|released\|converted`). A release does **not** increment `seat_hold_expired_total` | #9, #15, #29 |
| Q7 | Confirmation code | `TB-` + **8 uppercase alphanumerics**, unique | #17 |
| Q8 | Fake payment | A single **card number** field. Card `4000 0000 0000 0002` → **402** `payment_declined` and the hold stays active. Payment data is never logged or stored | #6, #7, #17, #22 |
| Q9 | Seed data | **2 venues, 4 events (3 upcoming, 1 past), ~100 seats per event** in at least 2 sections/price tiers, **1 demo user** (password from env `SEED_DEMO_PASSWORD`); idempotent | #10 |
| Q10 | Token storage (frontend) | **sessionStorage**. The XSS trade-off is documented in `docs/security.md` | #20 |
| Q11 | API base path | The backend serves at **root**. nginx and the Vite dev proxy **strip `/api`**. `openapi.yaml` `servers: /api` | #7, #19, #25 |
| Q12 | Seat map refresh | **Polling every 5 s** with TanStack Query (no SSE/WebSockets) | #21 |
| Q13 | e2e test in CI | Separate job **`e2e`**, **not** a required check (may become required once stable). #24 depends on the Compose stack (#26), so it runs out of phase order | #24 |
| Q14a | Hosting | **One Linux VM** with separate **dev and prod Docker Compose stacks**, **Caddy** with automatic HTTPS, **sslip.io** hostnames (no purchased domain). **Cloud provider: placeholder, the human decides before phase 9** | #35–#38 |
| Q14b | Seeded bug for the demo | A **deterministic** bug: an exception while computing the total when the reservation has a seat from one specific section, so `POST /checkout` returns **500** and the checkout error-rate alert reliably fires. It is merged to `develop` through a normal PR and deployed to **dev only**; no release PR `develop → main` is opened until the fix is merged, so it never reaches `main` or prod | #29, #42 |
| Q15 | App MCP server | **Python** (official MCP SDK / FastMCP). Reads through the app's **HTTP API**, not the DB | #43 |
| Q16 | `order_status` auth | Requires a **confirmation code and a valid user JWT** | #44 |
| Q17 | Makefile ownership | devops owns the Makefile. The scaffold exception (the PR that first creates `backend/` or `frontend/`) also covers adding `make lint` / `make test` targets, not only the `ci` job | #2, #8 |
| Q18 | Local Postgres before phase 7 | #8 adds a **Postgres-only Compose service** (`make db`). #26 extends that same compose file to the full stack | #8, #26 |
| Q19 | Labels | One type label plus `phase-<n>`. Test-only work uses **`chore`** | all |
| Q20 | `make load` | Built in **phase 8** (#32) so the dashboard can be checked with traffic; reused in phases 10–11 | #32 |

## Out of scope

Real payments, emails, refunds, multiple currencies.

## Key journey (instrumented)

browse events → open seat map → hold seats → checkout → confirmation
