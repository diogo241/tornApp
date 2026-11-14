# tornApp (NAF)

Internal admin app for a municipality to manage football/futsal tournaments,
clubs, referees, referee assignments and costs, municipal funding, and club
balances.

## Stack

Next.js 15 (App Router), React 19, Refine v5, better-auth, Prisma 7 +
PostgreSQL, Tailwind v4 + shadcn/ui, TypeScript.

## Commands

Run from the repository root with npm: `npm run dev`, `npm run build`,
`npm run start`, `npm run lint`, `npm run vercel-build`. Database:
`npx prisma migrate dev` and `npx prisma generate`.

No test runner is configured; `npm run lint` is the verification gate.

## Public member links

`/members/view?token=...` is a read-only, unauthenticated member page. The token
is an HMAC-SHA256 signature of the member UUID, generated from
`MEMBER_VIEW_SECRET`; it is not stored. The secret must be at least 32
characters (for example, `openssl rand -base64 48`) and set in every
environment. Rotating it invalidates every existing link. The authenticated API routes remain session-guarded; the only public API
route is `/api/public/members/view`.
