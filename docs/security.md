# Security

- **Auth**: email + password. Passwords are hashed with argon2 or bcrypt. JWT access tokens are
  short-lived and signed with a secret from the environment.
- **Secrets**: never committed. Use `.env` locally (gitignored) and GitHub Actions secrets or
  environments for deployed envs. `.claude/settings.local.json` is gitignored.
- **Input validation**: Pydantic models on every endpoint. Use the SQLAlchemy ORM or bound
  parameters only, never string-built SQL.
- **Authorization**: users can only read or modify their own reservations and orders.
- **Integrity**: seat double-booking is prevented by DB locks + unique constraints.
- **Telemetry PII**: see `docs/observability.md`. No emails, passwords, tokens or payment data.
- **Scanning**: Semgrep in CI (phase 9), plus ruff, mypy, eslint and tsc.
- **Supply chain**: lockfiles committed (`uv.lock`, `package-lock.json`). Pin GitHub Actions
  to major versions or SHAs.
- **Agents**: subagents have scoped tools (see `.claude/agents/`). Agents never deploy to prod,
  never merge, and never force-push. Prod deploy needs human approval through the `production`
  environment.
- **Branch protection**: rulesets on `develop` and `main` require PRs and the `ci` check, and block
  force pushes and deletion. Prod is deployed only from `main`.
