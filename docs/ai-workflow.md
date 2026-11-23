# AI workflow

How AI agents are used to build and run this project.

## Context management

- `CLAUDE.md` only imports `AGENTS.md`. `AGENTS.md` is short (overview, commands, rules) and
  links to modular docs in `docs/`. Agents load only what the task needs.
- `docs/plan.md` is the master plan. It was the source for every other context file.
- Each session has one job (groom, implement or verify). `/clear` between them keeps context small
  and stops the builder from verifying its own work.

## Agent team

Six role-scoped subagents (`docs/agents.md`), driven by slash commands in `.claude/commands/`.

## Tooling

- **GitHub**: the `gh` CLI and the GitHub MCP server, used for issues, PRs and the project board.
- **Grafana MCP server**: lets the sre-oncall agent query metrics, traces and logs.
- **Own MCP server** (phase 12): `list_events`, `seat_availability`, `order_status`.

## Autonomous on-call

Grafana alert → webhook → GitHub `repository_dispatch` → `oncall.yml` → Claude Code headless with
the sre-oncall subagent. It opens an incident issue, investigates telemetry, and opens a fix PR
with a regression test. A human still reviews and ships the fix. The agent never deploys to prod.

## Human checkpoints

- The backlog is shown to the human before issues are created.
- A human reviews every PR plus the QA verdict before `/ship`.
- Prod deploy needs manual approval.

## Decision log

- **Placeholder CI at bootstrap**: the ruleset requires the `ci` check, so a placeholder `ci` job
  ships first. Real lint/tests are wired in as soon as `backend/` and `frontend/` exist
  (phases 2–4). See `docs/process.md`.
- **develop/main branching** (#46): work merges into `develop` by squash and deploys to dev.
  Releases are `develop → main` PRs with merge commits, and prod deploys from `main` only.
