# Process

How work flows from idea to production. Grooming, implementation and verification happen in
**separate sessions** (`/clear` between them). The agent that builds never verifies its own work.

## Workflow

Start every session with `/status` (read-only). It reports the current branch, open PRs with CI and
QA verdicts, issues in progress, and the next `ready` issue, then recommends one next command.

1. **Groom**: `/groom <issue>`. The product-owner makes the issue ready: goal, acceptance
   criteria, out of scope, test plan. Then it adds the label `ready`.
2. **Implement**: `/clear`, then `/implement <issue>`. The dev agent creates a branch linked to
   the issue and cut from `develop`
   (`gh issue develop <N> --base develop --name <type>/<N>-<slug> --checkout`), writes code and
   tests, makes small commits `feat(scope): msg (refs #N)`, pushes, and opens a PR **into `develop`**
   with `Closes #N`.
   **It never merges.**
3. **Verify**: `/clear`, then `/verify <pr>`. QA checks out the PR fresh, runs `make test`, checks
   each acceptance criterion, and posts **APPROVE** or **CHANGES NEEDED** as a PR comment.
4. **Ship**: a human reviews the diff and the QA verdict, then runs `/ship <pr>`. That enables
   squash auto-merge into `develop`, and the PR merges once CI is green.
5. **Deploy to dev**: merging to `develop` triggers CD (`cd-dev.yml`), which deploys to dev
   automatically.
6. **Release**: when `develop` is ready, open a PR from `develop` into `main`, `/verify` it, and
   `/ship` it. Release PRs are merged with a **merge commit**, not squash.
7. **Deploy to prod**: manual only (`deploy-prod.yml`, `production` environment with required
   approval), and only from `main`.

## Fast track

Low-risk changes may skip step 3 (Verify). Use `/quick <issue>` instead of `/implement`, and the
PR gets the label **`fast-track`**. The fast track still needs:

- an issue (labeled `fast-track`),
- a branch cut from `develop` and a PR **into `develop`** with `Closes #N`,
- a green `ci` check,
- the human's review of the diff before `/ship`.

| May skip QA (fast track) | Always needs QA (`/verify`) |
|---|---|
| Docs: `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md` | `backend/` (app code, tests) |
| `.claude/` agents, commands, settings | `frontend/` (app code, tests) |
| Templates: `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md` | Database migrations |
| Small dependency bumps (patch/minor, lockfile only, CI green) | Workflows (`.github/workflows/`) |
| | Docker, Compose, deploy, infra |
| | Anything touching security, auth, telemetry or PII |
| | Release PRs (`develop → main`) |

If a change mixes both columns, it is **not** fast track. `/ship` checks the changed files of a
`fast-track` PR and refuses if any is in the right-hand column.

## Handoff comments

Sessions are cleared between steps, so the issue thread carries the state. Every `/implement`
and `/verify` session ends with a handoff comment on the issue (a release PR gets it on the PR).
So does any session that **stops midway**: blocked, interrupted, out of time, or waiting on a
question. Work in progress is committed and pushed before the comment is posted. `/status` reads
the latest `Handoff:` comment on each issue in progress.

```
Handoff: <implement | verify | stopped> — <one-line summary>
- Branch / PR: <branch>, #<pr> (or "none yet")
- Done: <what was completed, last commit SHA>
- Next: <the exact next step / command, e.g. `/verify 52`>
- Blockers / questions: <none, or what needs the human>
```

## Branching model

```
feat/12-x ──squash PR──┐
fix/15-y  ──squash PR──┼──► develop ──(auto)──► dev
chore/3-z ──squash PR──┘       │
                               └──release PR (merge commit)──► main ──(manual + approval)──► prod
```

- `develop` is the default branch and the base for all work. `main` holds released code only.
- Feature, fix and chore branches are cut from `develop` (`gh issue develop <N> --base develop ...`)
  and merged back into `develop` by a **squash** PR.
- A release is a PR `develop → main` merged with a **merge commit**, so `main` records each release
  and `develop` never needs a back-merge. `develop` is never deleted.
- Hotfixes: not defined yet.

## Git rules

- Never commit or push directly to `develop` or `main`. The rulesets enforce this.
- One issue = one branch = one PR.
- Branch name: `<type>/<issue>-<slug>` (types: feat, fix, chore, docs, infra, test).
- Conventional Commits. Never force-push. Use `gh` for GitHub actions.

## CI: the `ci` required check

Two rulesets, `develop-protection` and `main-protection`, protect both branches. Each one requires
PRs and the status check **`ci`**, and blocks force pushes and deletion. There are no required
approvals because this is a solo developer project. They also enforce the merge method: `develop`
allows only **squash**, and `main` allows only **merge commits**. `ci` runs on pull requests into
`develop` and `main`.

**Bootstrap decision (placeholder CI):** a required check that never runs would block every PR.
So at bootstrap, `.github/workflows/ci.yml` is created as a placeholder. It runs on
`pull_request` and on `push` to main, and has one job named exactly `ci` that checks out the code
and echoes "CI placeholder OK". It was pushed to main before the ruleset was created.

Rules that follow from this:
- **The job name `ci` is load-bearing. Never rename it**, or every PR becomes unmergeable.
- **As soon as `backend/` and `frontend/` exist (phases 2–4), replace the echo with real lint
  and test steps in the same `ci` job.** Don't wait for phase 9. Whoever adds
  `backend/` or `frontend/` also wires its lint/tests into `ci` in the same PR. That scaffold PR
  may also add the matching `make lint` / `make test` targets (decision Q17 in `docs/spec.md`).
- Phase 9 extends `ci` (Semgrep, contract check, image build) and adds `cd-dev.yml` and
  `deploy-prod.yml`.

## Parallel work

Independent issues can run in separate git worktrees, each with its own Claude session:

```bash
git fetch origin
git worktree add ../tb-<N> -b <type>/<N>-<slug> origin/develop
```

Each worktree sets its own `COMPOSE_PROJECT_NAME` and ports. Run at most 3 at a time. Remove
worktrees after merge (`git worktree remove ../tb-<N>`).

## Labels

feature, bug, chore, docs, infra, ready, incident, fast-track (see [Fast track](#fast-track)).
