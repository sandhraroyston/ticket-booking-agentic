---
description: Ship a verified PR — squash auto-merge once CI is green (human-triggered)
argument-hint: <pr-number>
---

The human has reviewed PR #$ARGUMENTS and wants to ship it.

1. `gh pr view $ARGUMENTS --comments`. Confirm the latest QA verdict is **APPROVE**. If not, stop
   and say why.
2. `gh pr checks $ARGUMENTS` to report CI status.
3. `gh pr merge $ARGUMENTS --squash --auto --delete-branch`
4. Report that auto-merge is enabled. Merging to main deploys to dev through CD. Prod is a
   separate manual approval.
5. If a worktree exists for this branch, remind me to remove it after merge.
