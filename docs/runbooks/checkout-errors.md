# Runbook: checkout errors / latency

## Alerts

- **CheckoutErrorRateHigh**: `checkout_failures_total` / checkout requests > 5% for 5 min.
- **CheckoutLatencyHigh**: p95 of `checkout_duration_seconds` > 2s for 5 min.

## Triage (human or sre-oncall agent)

1. Open the Grafana "Booking journey" dashboard and confirm the alert window and scope (one
   event? all events?).
2. Break down `checkout_failures_total` by `reason` (expired_hold, seat_conflict, db_error,
   validation, ...).
3. Jump from an exemplar to a failing trace. Check the span that errors (DB lock wait? constraint
   violation? exception in handler?).
4. Use the trace's `trace_id` to pull logs and read the exception and stack trace.
5. Check recent deploys (`gh run list --workflow cd-dev.yml`) and correlate them with the alert
   start.

## Common causes

| Symptom | Likely cause | Action |
|---|---|---|
| Spike in `expired_hold` | Hold TTL misconfigured, or clock skew | Check config/env; check `expires_at` logic |
| `seat_conflict` / unique violations | Locking regression (missing `FOR UPDATE`) | Revert or fix; add a concurrent regression test |
| High p95, lock waits | Long transactions, missing index | Inspect slow spans; add index; shorten the transaction |
| `db_error` | DB down or pool exhausted | Check `/readyz` and Postgres health |

## Response

1. Open an incident issue (label `incident`) with the alert, timeline, evidence links and
   suspected cause.
2. Open a fix PR with a regression test that links the incident. Normal workflow: QA verify,
   then human `/merge-pr`.
3. The fix reaches dev through CD. Prod deploy is manual, done by a human.
4. Close the incident with the root cause and follow-ups.
