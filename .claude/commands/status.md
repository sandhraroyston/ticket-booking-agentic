---
description: Find out where the project stands and what to do next
model: haiku
---
Do not change anything. Report:
1. Current branch and `git status` (uncommitted work?).
2. Open PRs (`gh pr list`) with CI status and whether QA has posted a verdict.
3. Issues in progress, and the latest "Handoff:" comment on each.
4. The next `ready` issue in phase order (`gh issue list --label ready`).
5. Which `ready` issues can be built in parallel right now (up to 3), using the rules in
   `docs/process.md` → Parallel work: dependencies closed, different scopes or separate files,
   at most one touching `openapi.yaml`, `ci.yml`, `Makefile`, `compose.yaml` or migrations. Give
   one line of reason per issue, and name any pair that must wait for the other.
Finish with one recommended next command, e.g. `/verify 46` or `/implement 13`, or a parallel
request such as "implement #6 and #9 in parallel".
