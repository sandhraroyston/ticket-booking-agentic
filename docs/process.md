# Process

How work flows from idea to production. Grooming, implementation and verification happen in
**separate sessions** (`/clear` between them). The agent that builds never verifies its own work.

## Workflow

1. **Groom**: `/groom <issue>`. The product-owner makes the issue ready: goal, acceptance
   criteria, out of scope, test plan. Then it adds the label `ready`.
2. **Implement**: `/clear`, then `/implement <issue>`. The dev agent creates a branch linked to
   the issue (`gh issue develop <N> --name <type>/<N>-<slug> --checkout`), writes code and tests,
   makes small commits `feat(scope): msg (refs #N)`, pushes, and opens a PR with `Closes #N`.
   **It never merges.**
3. **Verify**: `/clear`, then `/verify <pr>`. QA checks out the PR fresh, runs `make test`, checks
   each acceptance criterion, and posts **APPROVE** or **CHANGES NEEDED** as a PR comment.
4. **Ship**: a human reviews the diff and the QA verdict, then runs `/ship <pr>`. That enables
   squash auto-merge, and the PR merges once CI is green.
5. **Deploy**: merging to main triggers CD, which deploys to dev automatically. Prod deploy is
   manual (`deploy-prod.yml`, `production` environment with required approval).

## Git rules

- Never commit or push to `main`. The ruleset enforces this.
- One issue = one branch = one PR.
- Branch name: `<type>/<issue>-<slug>` (types: feat, fix, chore, docs, infra, test).
- Conventional Commits. Never force-push. Use `gh` for GitHub actions.

## CI: the `ci` required check

The `main` ruleset requires PRs, the status check **`ci`**, and no force pushes. There are no
required approvals because this is a solo developer project.

**Bootstrap decision (placeholder CI):** a required check that never runs would block every PR.
So at bootstrap, `.github/workflows/ci.yml` is created as a placeholder. It runs on
`pull_request` and on `push` to main, and has one job named exactly `ci` that checks out the code
and echoes "CI placeholder OK". It was pushed to main before the ruleset was created.

Rules that follow from this:
- **The job name `ci` is load-bearing. Never rename it**, or every PR becomes unmergeable.
- **As soon as `backend/` and `frontend/` exist (phases 2–4), replace the echo with real lint
  and test steps in the same `ci` job.** Don't wait for phase 9. Whoever adds
  `backend/` or `frontend/` also wires its lint/tests into `ci` in the same PR.
- Phase 9 extends `ci` (Semgrep, contract check, image build) and adds `cd-dev.yml` and
  `deploy-prod.yml`.

## Parallel work

Independent issues can run in separate git worktrees, each with its own Claude session:

```bash
git worktree add ../tb-<N> -b <type>/<N>-<slug>
```

Each worktree sets its own `COMPOSE_PROJECT_NAME` and ports. Run at most 3 at a time. Remove
worktrees after merge (`git worktree remove ../tb-<N>`).

## Labels

feature, bug, chore, docs, infra, ready, incident.
