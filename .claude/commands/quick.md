---
description: Fast-track a small non-code change (docs, agent/command files, config) without QA
argument-hint: <what to change>
model: sonnet
---
Only for changes listed as fast-track in docs/process.md. If the change touches
backend/, frontend/, migrations, workflows, Docker or deploy files, or anything to do with
security, auth or telemetry, stop and tell me
to use the normal /groom → /implement → /verify flow.

1. Create a small issue (`gh issue create`) with type label chore or docs plus `fast-track`.
2. `gh issue develop <N> --base develop --name <type>/<N>-<slug> --checkout`.
3. Make the change: $ARGUMENTS
4. Commit (refs #N), push, open a PR into develop with "Closes #N" and the `fast-track` label.
5. Show me the diff. Stop and wait for me to say "ship".
