# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

tornApp (NAF) is an internal admin app for a municipality to manage
football/futsal tournaments, clubs, referees, referee assignments and costs,
municipal funding, and club balances. Stack: Next.js 15 (App Router), React 19,
Refine v5, better-auth, Prisma 7 + PostgreSQL, Tailwind v4 + shadcn/ui, and
TypeScript. UI copy is Portuguese (pt-PT); code and comments are English.

## Commands

Run from the repository root with npm.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (`refine dev`). |
| `npm run build` | Production build (`refine build`). |
| `npm run start` | Start the production server (`refine start`). |
| `npm run lint` | ESLint via `next lint`. |
| `npm run vercel-build` | `prisma migrate deploy && prisma generate && refine build`. |
| `npx prisma migrate dev` | Create and apply a migration in development. |
| `npx prisma generate` | Regenerate the Prisma client. |

`Verify` (final gate): `npm run lint`.

No `test` or `typecheck` script is configured. `npx tsc --noEmit` can type-check
manually, but it is not an official project script and is not part of the gate.

## Testing

There is no test runner and no tests. Testing is opt-in and not a gate. Do not
claim test coverage that does not exist. If tests are added, add a `test` script
to `package.json` and document it here.

## Proportional engineering

- Build what the current requirement needs; do not add abstractions,
  dependencies, services, configuration surfaces, compatibility layers, or
  security mechanisms for hypothetical future scale.
- Prefer existing code, the standard library, native platform features, and
  installed dependencies before adding anything new.
- When a requirement is unknown, choose the smallest reversible design and ask
  about decisions that materially affect scope, data, security, or users.
- Treat network input, auth/session boundaries, shared persisted data,
  destructive operations, secrets, and sensitive data as trust boundaries:
  validate and guard them.
- Simplicity must still preserve real validation, data-loss prevention,
  accessibility, security, and configured project rules.

## Conventions

- Next.js App Router; route groups `(route)` (authenticated) and `(auth)`.
- API route handlers in `src/app/api/<resource>/route.ts` and `[id]/route.ts`,
  using `@lib/api` helpers, Zod validation, and a `getSession()` guard.
- Business logic in `src/lib/services`; Zod schemas in `src/lib/validators.ts`.
- All database access through Prisma (`src/lib/prisma.ts`).
- Format currency and dates with `src/lib/utils.ts` (pt-PT, EUR).
- UI: shadcn/Radix primitives under `src/components/ui`, Refine wrappers under
  `src/components/refine-ui`, feature components under `src/components/features`.
- Import aliases: `@/*`, `@lib`, `@components`, `@providers`.

## Code style

- TypeScript strict; avoid `any`.
- Do not add comments unless they explain non-obvious intent. File-level JSDoc on
  API handlers and service entry points matches the existing style.
