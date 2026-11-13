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
