# TraceFixer AI

TraceFixer AI diagnoses code errors across programming languages, saves each investigation, and keeps follow-up questions with the original debugging context.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/tracefixer-ai run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secrets: `DATABASE_URL`, `SESSION_SECRET`, and `GEMINI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tracefixer-ai` — React web app and authenticated debugging workflows
- `artifacts/api-server/src/routes` — API endpoints for auth and debugging sessions
- `lib/db/src/schema/tracefixer.ts` — PostgreSQL schema
- `lib/api-spec/openapi.yaml` — API contract and generated frontend/server validation types

## Architecture decisions

- Account passwords are bcrypt-hashed; the API returns short-lived-context JWTs signed with `SESSION_SECRET`.
- Gemini analysis uses the official Google GenAI SDK and the project-owned `GEMINI_API_KEY`.
- Debug sessions, diagnoses, and messages are always scoped to the authenticated account.

## Product

- Register and sign in to a private debugging workspace.
- Submit source code and stack traces for structured Gemini analysis, including a root cause, severity, category, ordered fixes, corrected code, and prevention advice.
- Search and filter saved sessions, resolve or reopen them, copy suggested patches, and ask contextual follow-up questions.

## User preferences

- Preserve the requested target language coverage: Python, JavaScript, TypeScript, Go, Rust, Java, C++, C#, SQL, Ruby, PHP, Swift, Kotlin, and Bash.

## Gotchas

- The web app uses generated API hooks; update the OpenAPI contract and rerun codegen before using new API operations in frontend code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
