---
description: Ship a verified PR — squash into develop, or merge-commit a release into main (human-triggered)
argument-hint: <pr-number>
model: sonnet
---

The human has reviewed PR #$ARGUMENTS and wants to merge it.

(This command was `/ship` until Claude Code added a built-in `/ship` that only reviews. The
built-in shadows a project command of the same name, so this one is `/merge-pr`.)

1. `gh pr view $ARGUMENTS --json baseRefName,headRefName,labels --comments`. Shipping is allowed if
   **either**:
   - the latest QA verdict comment is **APPROVE**, or
   - the PR has the **`fast-track`** label, its base is `develop`, and none of its changed files
     (`gh pr diff $ARGUMENTS --name-only`) is on an always-QA path from `docs/process.md` →
     Fast track (`backend/`, `frontend/`, migrations, `.github/workflows/`, Docker/Compose,
     deploy, or anything touching security, auth, telemetry). If one is, stop and tell me to
     run `/verify $ARGUMENTS`.

   Release PRs (base `main`) always need an APPROVE verdict. If neither condition holds, stop and
   say why.
2. `gh pr checks $ARGUMENTS` to report CI status. `ci` must be green (for a fast-track PR this is
   the only automated gate).
3. Merge according to the base branch. The rulesets reject the wrong method.
   - **Base `develop`** (feature, fix or chore):
     `gh pr merge $ARGUMENTS --squash --auto --delete-branch`
     (If CI has already passed, GitHub refuses `--auto` with "clean status"; then run the same
     command without `--auto`.)
     Merging to `develop` deploys to dev through CD.
   - **Base `main`** (release; head must be `develop`):
     `gh pr merge $ARGUMENTS --merge --auto`
     Use a merge commit, never squash, and **never** pass `--delete-branch`: `develop` must not
     be deleted. Merging to `main` does **not** deploy. Prod deploy is a separate manual
     `deploy-prod.yml` run with approval, from `main` only. Remind me to start it when I'm ready.
   - Any other base: stop. It's the wrong target branch.
   **If the merge command is denied by a permission prompt or the auto mode classifier,** don't
   retry it another way. Print the exact command for the human to run with `!`, e.g.
   `! gh pr merge $ARGUMENTS --squash --delete-branch`, then continue with steps 4–5 once they
   say it has run.
4. Report that auto-merge is enabled (or that the PR merged) and what happens next (a dev deploy, or a manual prod deploy).
5. If a worktree exists for this branch, remind me to remove it after merge.
