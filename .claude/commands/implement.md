---
description: Implement a ready issue on its own branch and open a PR (never merges)
argument-hint: <issue-number>
---

Implement issue #$ARGUMENTS.

1. `gh issue view $ARGUMENTS`. Stop if it lacks the `ready` label.
2. Pick the subagent by scope: **backend-dev** (backend/, openapi.yaml), **frontend-dev**
   (frontend/), or **devops** (Docker, CI/CD, infra). Split the work if it spans scopes.
3. Create a linked branch from an up-to-date main:
   `git switch main && git pull && gh issue develop $ARGUMENTS --name <type>/$ARGUMENTS-<slug> --checkout`
4. Implement with tests. Make small Conventional Commits `type(scope): msg (refs #$ARGUMENTS)`.
5. Run `make lint` and `make test` (whatever exists so far). If this PR creates `backend/` or
   `frontend/` for the first time, wire its lint/tests into the `ci` job (don't rename it).
6. `git push -u origin HEAD`, then `gh pr create --fill --body` using `.github/pull_request_template.md`,
   including `Closes #$ARGUMENTS`.
7. **Do not merge. Do not verify your own work.** Report the PR URL and tell me to run
   `/clear` then `/verify <pr>`.
