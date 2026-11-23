# Observability

Status: plan. Implemented in phase 8.

## Signals

- **Traces**: OpenTelemetry auto-instrumentation for FastAPI and SQLAlchemy. The browser uses the
  OTel web SDK and propagates `traceparent` from frontend to backend, so one trace covers the
  whole journey.
- **Logs**: structured JSON with `trace_id` and `span_id` on every line.
- **Metrics**:
  - `bookings_total` (counter)
  - `checkout_failures_total` (counter, label `reason`)
  - `checkout_duration_seconds` (histogram)
  - `seat_hold_expired_total` (counter)

## Pipeline

App → OTLP → `otel-collector` (attributes/redaction processor = PII scrubber) → Grafana
(otel-lgtm locally; Grafana Cloud for dev/prod).

## Privacy

Never send emails, passwords, tokens, or payment data to telemetry. Defence in depth:
1. Application code never puts them in span attributes, log fields or metric labels.
2. The collector's scrubber processor deletes or hashes known sensitive keys (`email`, `password`,
   `authorization`, `token`, `card*`) and redacts email-shaped values.
3. A test asserts that the scrubber config drops these keys.

## Dashboard

Provisioned "Booking journey" dashboard: request rate, error rate and p95 per journey step,
plus bookings and checkout failures. Exemplars link metrics → traces, and traces → logs via
`trace_id`.

## Alerts

See `docs/runbooks/checkout-errors.md`. The rules are checkout error rate > 5% for 5 min, or
checkout p95 > 2s.
