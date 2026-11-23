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

## Out of scope

Real payments, emails, refunds, multiple currencies.

## Key journey (instrumented)

browse events → open seat map → hold seats → checkout → confirmation
