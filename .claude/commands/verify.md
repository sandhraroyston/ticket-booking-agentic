---
description: Independently verify a PR — a feature PR into develop or a release PR into main (qa)
argument-hint: <pr-number>
---

Use the **qa** subagent to verify PR #$ARGUMENTS. Follow the procedure in `.claude/agents/qa.md`.

1. `gh pr view $ARGUMENTS --json baseRefName,headRefName,title,body` and check the base branch:
   - **Base `develop`** (normal work): the head must be a `<type>/<N>-<slug>` branch and the body
     must contain `Closes #N`. Read the linked issue's acceptance criteria.
   - **Base `main`** (release): the head must be exactly `develop`. Otherwise post
     **CHANGES NEEDED**, because only `develop` may be released to `main`.
   - Any other base: post **CHANGES NEEDED** (wrong target branch).
2. `gh pr checkout $ARGUMENTS` on a clean working tree.
3. Run `make lint` and `make test`. Check `gh pr checks $ARGUMENTS` (`ci` must be green).
4. Feature PR: check each acceptance criterion with evidence, plus the invariants (no double
   booking, no PII).
   Release PR: list the PRs and issues included (`gh pr view $ARGUMENTS --json commits`, or
   `git log origin/main..origin/develop --oneline`). Confirm each included PR has an APPROVE
   verdict and that dev has been deployed from this `develop` commit and is healthy.
5. Post one comment with `gh pr comment $ARGUMENTS`: **APPROVE** or **CHANGES NEEDED**, a table by
   criterion (or, for a release, by included PR), and a summary of the test output.

Never merge. Never change app logic to make things pass.
