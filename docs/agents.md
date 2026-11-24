# Agent team

Claude Code subagents defined in `.claude/agents/`. Each has a narrow responsibility and an
explicit list of things it may not do. The builder never verifies its own work.

| Agent | Responsibility | May not | Model |
|---|---|---|---|
| product-owner | Writes/grooms GitHub issues: goal, acceptance criteria, out of scope, test plan | Write code | sonnet |
| backend-dev | FastAPI, DB, migrations, unit tests, keeps `openapi.yaml` in sync | Touch frontend, CI | opus |
| frontend-dev | React UI, generated API client, component tests | Touch backend | sonnet |
| qa | Independent verification of PRs against acceptance criteria, integration + e2e tests, posts verdict on PR | Merge | opus |
| devops | Docker, Compose, CI/CD, deployment, Grafana provisioning | Change app logic | sonnet |
| sre-oncall | Woken by alerts; investigates telemetry, opens incident issue and fix PR | Deploy to prod | opus |

## Models

Each agent and command sets `model:` in its frontmatter.

- **opus** for work where subtle mistakes are costly: backend-dev (row locking, hold expiry,
  double-booking constraints), qa (the independent safety net; a weaker verifier tends to
  approve what it doesn't fully understand), and sre-oncall (root cause from telemetry).
- **sonnet** for well-known patterns where CI or QA catches mistakes: frontend-dev, devops,
  product-owner, and `/quick`.
- **haiku** for `/status`, which is read-only and only summarizes `gh` output.

If a sonnet agent struggles on an issue, run that issue on opus (e.g. #21 live polling, #30
browser tracing). Change a model with a `/quick` PR.

## Slash commands (`.claude/commands/`)

| Command | Agent | Session |
|---|---|---|
| `/groom <issue>` | product-owner | grooming |
| `/implement <issue>` | backend-dev / frontend-dev / devops (by label/scope) | implementation |
| `/verify <pr>` | qa | verification |
| `/ship <pr>` | human-triggered | after review |
| `/status` | (main session, haiku) | any time, read-only |
| `/quick <what to change>` | (main session, sonnet) | fast-track changes, see `docs/process.md` |

Note on CI ownership: devops owns `ci.yml` overall. But when backend-dev or frontend-dev
creates `backend/` or `frontend/` for the first time, that PR also replaces the placeholder echo
in the `ci` job with real lint/test steps (see `docs/process.md`). This is the one allowed
exception to "may not touch CI".

See `docs/process.md` for the full workflow.
