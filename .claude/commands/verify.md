---
description: Independently verify a PR against its acceptance criteria (qa)
argument-hint: <pr-number>
---

Use the **qa** subagent to verify PR #$ARGUMENTS. Follow the procedure in `.claude/agents/qa.md`:

1. `gh pr view $ARGUMENTS` and its linked issue (acceptance criteria).
2. `gh pr checkout $ARGUMENTS` on a clean working tree.
3. Run `make lint` and `make test`. Check `gh pr checks $ARGUMENTS`.
4. Check each acceptance criterion with evidence, plus the invariants (no double booking, no PII).
5. Post one comment with `gh pr comment $ARGUMENTS`: **APPROVE** or **CHANGES NEEDED**, a table by
   criterion, and a summary of the test output.

Never merge. Never change app logic to make things pass.
