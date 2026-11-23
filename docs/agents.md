# Agent team

Claude Code subagents defined in `.claude/agents/`. Each has a narrow responsibility and an
explicit list of things it may not do. The builder never verifies its own work.

| Agent | Responsibility | May not |
|---|---|---|
| product-owner | Writes/grooms GitHub issues: goal, acceptance criteria, out of scope, test plan | Write code |
| backend-dev | FastAPI, DB, migrations, unit tests, keeps `openapi.yaml` in sync | Touch frontend, CI |
| frontend-dev | React UI, generated API client, component tests | Touch backend |
| qa | Independent verification of PRs against acceptance criteria, integration + e2e tests, posts verdict on PR | Merge |
| devops | Docker, Compose, CI/CD, deployment, Grafana provisioning | Change app logic |
| sre-oncall | Woken by alerts; investigates telemetry, opens incident issue and fix PR | Deploy to prod |

## Slash commands (`.claude/commands/`)

| Command | Agent | Session |
|---|---|---|
| `/groom <issue>` | product-owner | grooming |
| `/implement <issue>` | backend-dev / frontend-dev / devops (by label/scope) | implementation |
| `/verify <pr>` | qa | verification |
| `/ship <pr>` | human-triggered | after review |

Note on CI ownership: devops owns `ci.yml` overall. But when backend-dev or frontend-dev
creates `backend/` or `frontend/` for the first time, that PR also replaces the placeholder echo
in the `ci` job with real lint/test steps (see `docs/process.md`). This is the one allowed
exception to "may not touch CI".

See `docs/process.md` for the full workflow.
