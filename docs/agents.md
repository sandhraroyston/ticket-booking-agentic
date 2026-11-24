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

Change a default model with a `/quick` PR.

### When to upgrade a model

The label **`needs-opus`** on an issue means "build this issue with opus", whatever the agent's
default. `/implement` reads it and runs the agent with `model: opus` for that issue only.

Add `needs-opus` when any of these happens:

| Who notices | Trigger |
|---|---|
| **qa** | CHANGES NEEDED because of a **quality** problem, not a small slip: wrong design, missed edge cases or error paths, race conditions, tests that don't really test the criterion, or code that works but is hard to follow |
| **qa** | A **second** CHANGES NEEDED on the same issue |
| **builder** | The same check still fails after **2 fix attempts**, or the agent isn't sure the design is right |
| **builder** | The issue turns out to involve concurrency, locking, auth, or tricky async/timing behaviour |
| **product-owner** | While grooming, the issue clearly involves the above (pre-label it) |
| **human** | Any time you think the output isn't good enough |

The one who adds the label says why in the verdict or handoff comment
(`Model: needs-opus because ...`). A small slip (typo, a missed criterion, a lint error) is
**not** a reason to upgrade; send it back to the same model.

Likely candidates on the current backlog: #21 (live polling), #22 (checkout wiring), #30 (browser
tracing and trace propagation), #36–#37 (deploy workflows).

The opus agents (backend-dev, qa, sre-oncall) are already on the strongest model. If their work
isn't good enough, the fix is a clearer issue (`/groom`), not a different model.

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
