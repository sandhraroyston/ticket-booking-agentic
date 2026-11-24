---
description: Fast-track a low-risk issue (docs, .claude config, templates, small dependency bumps) — branch, PR with the fast-track label, then stop for human review
argument-hint: <issue-number>
---

Fast-track issue #$ARGUMENTS. See `docs/process.md` → Fast track.

1. `gh issue view $ARGUMENTS`. Confirm the change belongs in the **may skip QA** column of the
   Fast track table. If it touches anything in the **always needs QA** column (`backend/`,
   `frontend/`, migrations, `.github/workflows/`, Docker/Compose/deploy, security, auth,
   telemetry), stop and tell me to use `/implement` instead.
2. Make sure the issue has the `fast-track` label (`gh issue edit $ARGUMENTS --add-label fast-track`).
3. Create a linked branch from an up-to-date `develop`:
   `git switch develop && git pull && gh issue develop $ARGUMENTS --base develop --name <type>/$ARGUMENTS-<slug> --checkout`
4. Make the change. Small Conventional Commits `type(scope): msg (refs #$ARGUMENTS)`.
5. Before pushing, check the changed files: `git diff --name-only origin/develop...HEAD`. If any
   file is on an always-QA path, stop and say so.
6. Run `make lint` and `make test` if they exist.
7. `git push -u origin HEAD`, then open the PR into `develop` with the label:
   `gh pr create --base develop --label fast-track` and a body from
   `.github/pull_request_template.md` that includes `Closes #$ARGUMENTS` and states "Fast track:
   no QA session".
8. Wait for `ci` (`gh pr checks <pr> --watch`). Fix it if it fails.
9. Post a handoff comment on the issue in the format from `docs/process.md`, with
   `Handoff: implement (fast track)` and Next = "human reviews the diff, then `/ship <pr>`".
10. **Stop.** Do not merge. Report the PR URL and the list of changed files for my review.

**If you stop before finishing**, commit and push work in progress and post `Handoff: stopped`
on the issue, as `/implement` does.
