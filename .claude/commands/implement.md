---
description: Implement a ready issue on its own branch from develop and open a PR into develop (never merges)
argument-hint: <issue-number>
---

Implement issue #$ARGUMENTS.

1. `gh issue view $ARGUMENTS`. Stop if it lacks the `ready` label.
   Before starting, tell me which other `ready` issues could be built in parallel with this one
   (rules in `docs/process.md` → Parallel work), with one line of reason each. Then carry on with
   #$ARGUMENTS; don't start the others unless I ask.
2. Pick the subagent by scope: **backend-dev** (backend/, openapi.yaml), **frontend-dev**
   (frontend/), or **devops** (Docker, CI/CD, infra). Split the work if it spans scopes.
   If the issue has the label **`needs-opus`**, run the subagent with `model: opus` (override its
   default) and say so in the PR body. See `docs/agents.md` → When to upgrade a model.
3. Create a linked branch **cut from an up-to-date `develop`** (never from `main`):
   `git switch develop && git pull && gh issue develop $ARGUMENTS --base develop --name <type>/$ARGUMENTS-<slug> --checkout`
   If you are in a worktree, it must have been created from `origin/develop`.
4. Implement with tests. Make small Conventional Commits `type(scope): msg (refs #$ARGUMENTS)`.
5. Run `make lint` and `make test` (whatever exists so far). If this PR creates `backend/` or
   `frontend/` for the first time, wire its lint/tests into the `ci` job (don't rename it).
6. `git push -u origin HEAD`, then open the PR **into `develop`**:
   `gh pr create --base develop` with a body from `.github/pull_request_template.md` that
   includes `Closes #$ARGUMENTS`.
7. Post a handoff comment on the issue (`gh issue comment $ARGUMENTS --body ...`) using the
   format in `docs/process.md` → Handoff comments, with `Handoff: implement` and
   Next = `/verify <pr>`.
8. **Do not merge. Do not verify your own work.** Report the PR URL and tell me to run
   `/clear` then `/verify <pr>`.

**Escalate the model** if the same check still fails after 2 fix attempts, you're not sure the
design is right, or the issue turns out to involve concurrency, locking, auth or tricky timing:
push WIP, add `needs-opus` to the issue, and post `Handoff: stopped` with
`Model: needs-opus because <reason>` and Next = `/implement $ARGUMENTS`.

**If you stop before finishing** (blocked, a failing test you can't fix, an open question, the
session is ending, or I interrupt), first commit and push work in progress to the branch
(`wip(scope): ... (refs #$ARGUMENTS)`), then post `Handoff: stopped` on the issue saying what is
done, what remains, and what blocks you. Never leave an issue half-done without a handoff.
