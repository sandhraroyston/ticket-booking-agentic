---
description: Ship a verified PR — squash into develop, or merge-commit a release into main (human-triggered)
argument-hint: <pr-number>
---

The human has reviewed PR #$ARGUMENTS and wants to ship it.

1. `gh pr view $ARGUMENTS --json baseRefName,headRefName --comments`. Confirm the latest QA verdict
   is **APPROVE**. If not, stop and say why.
2. `gh pr checks $ARGUMENTS` to report CI status.
3. Merge according to the base branch. The rulesets reject the wrong method.
   - **Base `develop`** (feature, fix or chore):
     `gh pr merge $ARGUMENTS --squash --auto --delete-branch`
     Merging to `develop` deploys to dev through CD.
   - **Base `main`** (release; head must be `develop`):
     `gh pr merge $ARGUMENTS --merge --auto`
     Use a merge commit, never squash, and **never** pass `--delete-branch`: `develop` must not
     be deleted. Merging to `main` does **not** deploy. Prod deploy is a separate manual
     `deploy-prod.yml` run with approval, from `main` only. Remind me to start it when I'm ready.
   - Any other base: stop. It's the wrong target branch.
4. Report that auto-merge is enabled and what happens next (a dev deploy, or a manual prod deploy).
5. If a worktree exists for this branch, remind me to remove it after merge.
