# Product spec

Status: phase 1. Full user stories, decisions and traceability. Update this file when a story is
groomed.

## Users

- **Buyer**: browses events, holds seats, pays, views orders.
- **Admin** (MVP: seed data only): venues, events, seat maps.

## User stories

This is a summary. The full stories with Given/When/Then criteria are below. "Error" marks an
error case. Decisions (Q1–Q20) are in [Decisions](#decisions). Undecided items are in
[Open questions](#open-questions) and are not requirements.

| ID | Story | Key acceptance criteria |
|---|---|---|
| US-1 | As a buyer I can sign up and log in with email + password | JWT issued on login; duplicate email rejected; password stored hashed |
| US-2 | As a buyer I can browse upcoming events | Shows name, venue, date, price range; past events hidden |
| US-3 | As a buyer I can see an event's seat map with live availability | Each seat shows available / held / sold; refreshes without reload |
| US-4 | As a buyer I can hold up to 6 seats for 10 minutes | >6 seats rejected; held seats unavailable to others; hold has `expires_at` |
| US-5 | Holds expire automatically | After 10 min, seats return to available; `seat_hold_expired_total` increments |
| US-6 | As a buyer I can check out a hold with a fake payment | Creates an order with a confirmation code; seats become sold |
| US-7 | Checkout of an expired hold fails clearly | 409 `hold_expired` with a clear message; no order created (Q1) |
| US-8 | As a buyer I can see my orders | Lists my orders with confirmation codes only |
| US-9 | Seed data exists | A few venues, events and seat maps via `make seed` |

All error responses use the shared `{code, message}` error schema (Q1). The exact codes and
schemas are in `openapi.yaml` (#7).

### US-1: Sign up and log in

As a buyer, I want to sign up and log in with my email and password, so that I can hold seats
and see my orders.

Decisions: Q3 (JWT 60 min, no refresh token), Q4 (password at least 8 characters), Q10 (token in
sessionStorage).

- [ ] Given a new email and a password of at least 8 characters, when I sign up
  (`POST /auth/signup`), then the response is 201 and the password is stored only as a hash
  (argon2 or bcrypt), never in plaintext.
- [ ] Given valid credentials, when I log in (`POST /auth/login`), then the response is 200 with a
  signed JWT that expires after 60 minutes (configurable by env). No refresh token is issued.
- [ ] Given I am logged in, when I call a protected endpoint (reservations, checkout, orders),
  then the JWT is sent as `Authorization: Bearer` and accepted. When I log out, the token is
  removed and protected pages redirect to the login page.
- [ ] Error: given an email that is already registered (in any letter case), when I sign up, then
  the response is 409 and the UI shows "Email already registered".
- [ ] Error: given a wrong password or an unknown email, when I log in, then the response is 401
  with the same message for both, and the UI shows "Wrong email or password".
- [ ] Error: given an invalid email or a password shorter than 8 characters, when I sign up, then
  the response is 422. The UI shows an inline error and sends no request.
- [ ] Error: given a missing, expired or tampered token, when I call a protected endpoint, then
  the response is 401, and the UI logs me out and redirects to the login page.
- [ ] No email, password or token appears in logs, telemetry or the browser console.

### US-2: Browse upcoming events

As a buyer, I want to see upcoming events, so that I can choose one to attend.

- [ ] Given seeded events, when I open the events list (`GET /events`), then only events with
  `starts_at` in the future are shown, sorted by `starts_at` ascending.
- [ ] Given an event in the list, when it is shown, then it has its name, venue name and city,
  date/time and price range (min–max of its seat prices; cents in the API).
- [ ] Given an event, when I open it (`GET /events/{id}`), then I see the same fields plus its
  description.
- [ ] Given I am not logged in, when I browse events, then the list and the event page still work
  (public endpoints).
- [ ] Given no upcoming events, when the list loads, then the empty state "No upcoming events" is
  shown.
- [ ] Error: given an unknown event id, when `GET /events/{id}` is called, then the response is
  404.
- [ ] Error: given the API fails or is unreachable, when the list loads, then a readable error
  message with a "Retry" button is shown instead of a blank page.

### US-3: Seat map with live availability

As a buyer, I want to see an event's seat map with live availability, so that I can pick free
seats.

Decisions: Q12 (polling every 5 s).

- [ ] Given an event, when I open its seat map (`GET /events/{id}/seats`), then every seat is shown
  grouped by section and row, with its price and status `available`, `held` or `sold`.
- [ ] Given seat statuses, when shown, then each status has a distinct colour and an accessible
  label (not colour only).
- [ ] Given a seat in an active, unexpired hold, then its status is `held`; given a sold seat, then
  its status is `sold`. The response never reveals who holds or bought a seat.
- [ ] Given the seat map is open, when another user holds or buys seats, then my map shows them
  as held or sold within 5 seconds without a page reload.
- [ ] Given a seat I selected becomes held by someone else, when the map refreshes, then it is
  deselected and I see a notice.
- [ ] Error: given an unknown event id, when I open the seat map, then the response is 404 and the
  UI shows "Event not found".

### US-4: Hold up to 6 seats for 10 minutes

As a buyer, I want to hold up to 6 seats for 10 minutes, so that nobody else can take them while
I pay.

Decisions: Q2 (max 6 seats per reservation; one active hold per user per event), Q6 (manual
release gives status `released`).

- [ ] Given 1–6 available seats of one event and a valid JWT, when I hold them
  (`POST /reservations`), then the response is 201 with the reservation id, seat ids, status
  `active` and `expires_at` = now + 10 minutes, and the seats become `held` for everyone.
- [ ] Given an active hold, when it is shown, then I see the seats, the total and a countdown to
  the server `expires_at`.
- [ ] Given my active hold, when I release it (`DELETE /reservations/{id}`), then the response is
  204, the reservation becomes `released` and its seats become `available`. Releasing an
  expired or released hold again also returns 204 and changes nothing.
- [ ] Error: given 0 or more than 6 seat ids, duplicate ids, or seats from different events, when I
  hold them, then the response is 422 and nothing changes. The UI does not select a 7th seat and
  shows "You can hold up to 6 seats".
- [ ] Error: given any requested seat is already held or sold, when I hold, then the response is
  409 naming the unavailable seat ids, and none of the requested seats is held (all-or-nothing).
  The UI shows "Some seats were just taken" and refreshes the map.
- [ ] Error: given I already have an active hold for this event, when I hold again, then the
  response is 409 `active_hold_exists` and nothing changes. A hold on another event is allowed.
- [ ] Error: given no or an invalid JWT, when I hold or release, then the response is 401. Given
  another user's reservation, when I release it, then the response is 404 and nothing changes.
  Given a reservation already converted to an order, when I release it, then the response is
  409 and the seats stay `sold`.
- [ ] Given two concurrent holds on the same seat, then they never both succeed: the database
  rejects the second (row locks and a unique constraint, see [Invariants](#invariants)) and the
  API answers 409, not 500.

### US-5: Holds expire automatically

As a buyer, I want holds to expire automatically, so that seats nobody pays for become
available again.

Decisions: Q5 (lazy release plus a 30 s background sweeper; idempotent release), Q6 (a manual
release is not an expiry).

- [ ] Given an active hold whose `expires_at` has passed, when the seat map is read or a new hold
  touches its seats, then the reservation becomes `expired` and its seats are `available` in
  that same response.
- [ ] Given expired holds and no traffic, when the background sweeper runs (every 30 s,
  configurable by env), then the holds are marked `expired` and their seats are released.
- [ ] Given seats from an expired hold, when another user holds them, then the response is 201.
- [ ] Given a hold expires (lazily or by the sweeper), then `seat_hold_expired_total` increments
  exactly once for that reservation. A manual release does not increment it.
- [ ] Given the lazy path and the sweepers of several app replicas run at the same time on one
  reservation, when they finish, then it is expired exactly once and no error occurs.
- [ ] Error: given a hold that has not expired yet, when the sweeper runs, then it is unchanged.

### US-6: Check out a hold with a fake payment

As a buyer, I want to pay for my hold with a fake payment, so that I get an order and the seats
are mine.

Decisions: Q7 (confirmation code `TB-` + 8 uppercase alphanumerics), Q8 (single card number
field; card `4000 0000 0000 0002` is declined).

- [ ] Given my active, unexpired hold and a card number, when I check out (`POST /checkout`), then
  the response is 201 with an order: id, a unique confirmation code `TB-` + 8 uppercase
  alphanumerics, and `total_cents` = the sum of the seat prices.
- [ ] Given a successful checkout, then the seats become `sold`, the reservation becomes
  `converted`, and a confirmation page shows the confirmation code and the seats.
- [ ] Given the fake payment form, when shown, then it has a single card number field. The card
  number is never logged, stored or sent to telemetry.
- [ ] Error: given card `4000 0000 0000 0002`, when I check out, then the response is 402
  `payment_declined`, the UI shows "Payment declined", and the hold and countdown stay active.
- [ ] Error: given a reservation that is already converted, when I check out again, then the
  response is 409 and no second order is created.
- [ ] Error: given another user's reservation or an unknown id, then the response is 404; given no
  JWT, then 401.
- [ ] Given a successful checkout, then `bookings_total` increments by 1. Given a failed checkout,
  then `checkout_failures_total` increments with a `reason` label from a fixed set (listed in
  `docs/observability.md`).

### US-7: Checkout of an expired hold fails clearly

As a buyer, I want a clear message when my hold has expired, so that I know to pick seats again.

Decisions: Q1 (409 `hold_expired`).

- [ ] Error: given my reservation is past its `expires_at` (even if the sweeper has not run yet),
  when I check out, then the response is 409 with code `hold_expired` and message "Hold expired".
- [ ] Given that 409, then no order is created and the seats are not sold.
- [ ] Error: given that 409, or the countdown reaches 0, when I try to pay, then the UI shows
  "Your hold has expired. Please select seats again." and takes me back to the seat map.
- [ ] Given checkout and expiry race on the same reservation, then checkout locks the reservation
  row and checks `status = active` and `expires_at > now()` in the same transaction, so an
  expired hold is never sold.
- [ ] Given an expired-hold checkout, then `checkout_failures_total{reason="expired_hold"}`
  increments.

### US-8: See my orders

As a buyer, I want to see my orders, so that I can find my confirmation codes.

- [ ] Given I have orders, when I open "My orders" (`GET /orders/me`), then I see my orders newest
  first, each with confirmation code, event name, date/time, seats (section, row, number) and
  total.
- [ ] Given another user has orders, when I open "My orders", then none of their orders appear.
- [ ] Given I have no orders, when I open "My orders", then the response is 200 with an empty list.
- [ ] Error: given no or an invalid JWT, when `GET /orders/me` is called, then the response is
  401. Given I am logged out, when I open the page, then I am redirected to the login page.

### US-9: Seed data exists

As an admin (MVP: seed data only), I want seed venues, events and seat maps, so that the app can
be demoed and tested without an admin UI.

Decisions: Q9 (seed contents), Q18 (local Postgres via `make db`).

- [ ] Given a migrated empty database, when I run `make seed`, then it creates 2 venues, 4 events
  (3 upcoming, 1 past), about 100 seats per event in at least 2 sections or price tiers, and
  1 demo user whose password comes from env `SEED_DEMO_PASSWORD`.
- [ ] Given seed data already exists, when I run `make seed` again, then it succeeds and the row
  counts stay the same (idempotent).
- [ ] Given the seed, when inspected, then all seats start as `available`, and no seed password is
  hard-coded or written to logs.
- [ ] Error: given the database is not migrated or is unreachable, when I run `make seed`, then it
  exits non-zero with a clear message.
- [ ] Given the backend is running, when an operator calls `GET /healthz`, then it returns 200, and
  `GET /readyz` returns 200 if Postgres is reachable. Error: given Postgres is unreachable, then
  `GET /readyz` returns 503.

## Plan mapping

Every MVP feature (plan §2) and endpoint (plan §6) maps to at least one story. No story adds
scope beyond plan §2 and the endpoints in §6.

| Plan §2 item | Stories |
|---|---|
| Sign up / log in (email + password, JWT) | US-1 |
| Browse upcoming events (name, venue, date, price range) | US-2 |
| Seat map with live availability (available / held / sold) | US-3 |
| Hold up to 6 seats for 10 minutes | US-4 |
| Holds expire automatically | US-5 |
| Checkout with a fake payment; creates an order and marks seats sold | US-6 |
| "My orders" page with confirmation codes | US-8 |
| Admin seed data: venues, events, seat maps | US-9 |
| Expected: two users never buy the same seat (enforced in the DB) | US-4, US-6, [Invariants](#invariants) |
| Expected: expired holds release seats | US-5 |
| Expected: checkout of an expired hold fails with a clear error | US-7 |

| Plan §6 endpoint | Stories |
|---|---|
| `POST /auth/signup`, `POST /auth/login` | US-1 |
| `GET /events`, `GET /events/{id}` | US-2 |
| `GET /events/{id}/seats` | US-3, US-5 |
| `POST /reservations` | US-4, US-5 |
| `DELETE /reservations/{id}` | US-4 |
| `POST /checkout` | US-6, US-7 |
| `GET /orders/me` | US-8 |
| `GET /healthz`, `GET /readyz` | US-9 (operator checks) |

## Traceability

Story → GitHub issues. "Cites the ID" lists issues whose title or body names the story ID, so a
search for the ID on the board finds them. "Also implements" lists issues that build part of the
story without naming it.

| Story | Cites the ID | Also implements |
|---|---|---|
| US-1 | [#5](https://github.com/sandhraroyston/ticket-booking-agentic/issues/5), [#11](https://github.com/sandhraroyston/ticket-booking-agentic/issues/11) | [#20](https://github.com/sandhraroyston/ticket-booking-agentic/issues/20) |
| US-2 | [#3](https://github.com/sandhraroyston/ticket-booking-agentic/issues/3), [#12](https://github.com/sandhraroyston/ticket-booking-agentic/issues/12), [#21](https://github.com/sandhraroyston/ticket-booking-agentic/issues/21) | |
| US-3 | [#4](https://github.com/sandhraroyston/ticket-booking-agentic/issues/4), [#13](https://github.com/sandhraroyston/ticket-booking-agentic/issues/13), [#21](https://github.com/sandhraroyston/ticket-booking-agentic/issues/21) | |
| US-4 | [#4](https://github.com/sandhraroyston/ticket-booking-agentic/issues/4), [#6](https://github.com/sandhraroyston/ticket-booking-agentic/issues/6), [#14](https://github.com/sandhraroyston/ticket-booking-agentic/issues/14), [#22](https://github.com/sandhraroyston/ticket-booking-agentic/issues/22) | [#9](https://github.com/sandhraroyston/ticket-booking-agentic/issues/9), [#15](https://github.com/sandhraroyston/ticket-booking-agentic/issues/15), [#23](https://github.com/sandhraroyston/ticket-booking-agentic/issues/23) |
| US-5 | [#16](https://github.com/sandhraroyston/ticket-booking-agentic/issues/16), [#23](https://github.com/sandhraroyston/ticket-booking-agentic/issues/23) | [#29](https://github.com/sandhraroyston/ticket-booking-agentic/issues/29) |
| US-6 | [#6](https://github.com/sandhraroyston/ticket-booking-agentic/issues/6), [#17](https://github.com/sandhraroyston/ticket-booking-agentic/issues/17), [#22](https://github.com/sandhraroyston/ticket-booking-agentic/issues/22) | [#9](https://github.com/sandhraroyston/ticket-booking-agentic/issues/9), [#29](https://github.com/sandhraroyston/ticket-booking-agentic/issues/29) |
| US-7 | [#6](https://github.com/sandhraroyston/ticket-booking-agentic/issues/6), [#17](https://github.com/sandhraroyston/ticket-booking-agentic/issues/17), [#22](https://github.com/sandhraroyston/ticket-booking-agentic/issues/22), [#23](https://github.com/sandhraroyston/ticket-booking-agentic/issues/23) | [#29](https://github.com/sandhraroyston/ticket-booking-agentic/issues/29) |
| US-8 | [#6](https://github.com/sandhraroyston/ticket-booking-agentic/issues/6), [#18](https://github.com/sandhraroyston/ticket-booking-agentic/issues/18), [#22](https://github.com/sandhraroyston/ticket-booking-agentic/issues/22) | |
| US-9 | [#10](https://github.com/sandhraroyston/ticket-booking-agentic/issues/10) | [#8](https://github.com/sandhraroyston/ticket-booking-agentic/issues/8) (health endpoints, `make db`) |

`openapi.yaml` for all endpoints is #7. The key-journey end-to-end test is #24.

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

## Open questions

These items are **not decided**, so they are **not requirements**. Stories and issues must not
depend on an answer until the human decides and the answer moves to [Decisions](#decisions).

| # | Question | Where it matters | Current state |
|---|---|---|---|
| OQ1 | Does `POST /auth/signup` also return a JWT, or does the client call `POST /auth/login` after signup? #5 says the buyer is signed in after signup; #11 only says signup returns 201. | US-1, #5, #7, #11, #20 | Either way meets US-1. Decide while #7 (`openapi.yaml`) is written. |
| OQ2 | Which cloud provider hosts the VM? | #35–#38 | Placeholder in Q14a. The human decides before phase 9. |
| OQ3 | Which single currency are prices shown in, and in what format? | US-2, US-3, US-6, US-8, #3, #4, #6 | Prices are integer cents. Multiple currencies are out of scope, but the one currency is not named. |
| OQ4 | Does `GET /events` need pagination? | US-2, #7, #12 | Not required. The seed has 3 upcoming events (Q9). |
| OQ5 | When does the `e2e` CI job become a required check? | #24 | Q13 says "not required; may become required once stable". No criterion for "stable" yet. |

## Out of scope

Real payments, emails, refunds, multiple currencies.

## Key journey (instrumented)

browse events → open seat map → hold seats → checkout → confirmation
