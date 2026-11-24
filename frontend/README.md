# Frontend

React + Vite + TypeScript, Tailwind CSS v4, TanStack Query, React Router. See
`docs/architecture.md`. Requires Node 20.19+ (`.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173, proxies /api to http://localhost:8000
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # Vitest + React Testing Library
npm run build
```

From the repo root, `make lint` and `make test` run the same checks.

The API client will be generated from `openapi.yaml`. Do not hand-write API types.
