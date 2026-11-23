---
description: Groom a GitHub issue until it is ready (product-owner)
argument-hint: <issue-number>
---

Use the **product-owner** subagent to groom issue #$ARGUMENTS.

1. `gh issue view $ARGUMENTS --comments`
2. Make sure it has: Goal, 3–7 testable acceptance criteria (Given/When/Then, at least one error
   case), Out of scope, Test plan, "Depends on #N" if relevant, one type label plus `phase-<n>`.
3. If anything is ambiguous, ask me. Don't invent requirements.
4. Update the issue with `gh issue edit`, update `docs/spec.md` if the story changed, then add
   label `ready`.
5. Summarise what changed. Do not write code.
