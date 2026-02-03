# AGENTS.md

This file contains instructions for agentic coding assistants working in this repository.

## Project Overview

- **Framework**: Next.js 15 with App Router
- **Admin Framework**: Refine (headless React admin framework)
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: better-auth
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Node**: >=20

## Commands

### Development
```bash
npm run dev          # Start development server
```

### Build & Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

### Testing
This project does not have tests configured. When adding tests, use a testing framework compatible with Next.js (e.g., Vitest, Jest with @testing-library/react).

### Database
```bash
npx prisma generate  # Generate Prisma client (outputs to ./generated/prisma)
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio for database inspection
```

## Path Aliases

Use these path aliases for imports:
- `@/` → `./src/` (e.g., `@/components/ui/button`)
- `@pages/*` → `./pages/*` (legacy routes, avoid using in new code)

## Code Style Guidelines

### Imports

1. Group imports: React/Next.js → Third-party → Internal (@/...)
2. Use `import type` for type-only imports when possible
3. Named exports: `export const Button = ({ ... }) => { ... };`
4. Client components must include `'use client';` at the very top

### Component Structure

1. Use function components with named exports
2. Destructure props at the function signature:
   ```tsx
   function Button({ className, variant, size, asChild = false, ...props }: Props) {
   ```
3. Use `React.ComponentProps<"button">` for extending native element props
4. Set `displayName` on exported components for debugging: `Header.displayName = "Header";`

### TypeScript

1. Always use strict TypeScript features enabled in `tsconfig.json`:
   - `strict: true`
   - `forceConsistentCasingInFileNames: true`
   - Proper type imports with `import type`

2. Define types inline for component-specific props, or use utility types:
   ```tsx
   type Category = { id: string; title: string; };
   ```

3. Use `Readonly` for immutable props (Next.js default):

### Styling

1. Use `cn()` utility from `@/lib/utils` for conditional className merging (combines `clsx` + `tailwind-merge`)
2. Prefer shadcn/ui components and extend them via variants
3. Use class-variance-authority (cva) for component variants
4. Tailwind classes: use lowercase, hyphenated utility classes

### File Naming

- Components: `PascalCase.tsx` (e.g., `Header.tsx`, `UserAvatar.tsx`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)
- Pages: `lowercase.tsx` in app/ directory (Next.js convention)
- Server vs Client: suffix with `.server.ts` or `.client.ts` when module needs distinction

### Database (Prisma)

1. Schema is in `prisma/schema.prisma`
2. Generated client is at `./generated/prisma` (not `node_modules`)
3. Custom table names use `@@map("table_name")`
4. Always use `await` when calling Prisma methods
5. Use `convertToPlainObject()` from `@/lib/utils` when passing Prisma objects to client components

### API Routes

1. Use standardized API utilities from `@/lib/api`:
   - `apiError(error, status, message?, details?)` for error responses
   - `apiListSuccess(data, total, status?)` for paginated list responses
   - `validateQueryParams(searchParams, schema)` for query validation
   - `handleValidationError(error)` for Zod error formatting
2. Always validate sessions with `getSession()` from `@/lib/auth`
3. Use Prisma transactions for atomic operations: `prisma.$transaction([...])`
4. Return meaningful HTTP status codes via `HttpStatusCode` enum
5. Log errors in API routes for debugging (use proper logging in production)

### Validation (Zod)

1. All validators are in `@/lib/validators.ts`
2. Use `z.coerce` for query params (strings to numbers/dates)
3. Use `z.preprocess` for complex type transformations (e.g., string with comma to float)
4. Use `.refine()` for cross-field validation
5. Example pattern:
   ```tsx
   export const insertUser = z.object({
     name: z.string().min(3).max(50).trim(),
     email: z.string().email().min(3).max(50).trim(),
   }).refine((data) => data.password === data.confirmPassword, {
     message: "Passwords don't match",
     path: ['confirmPassword'],
   });
   ```

### Authentication (better-auth)

1. Auth utilities are in `@/lib/auth`
2. Middleware protects API routes at `/api/*` (except `/api/auth/*`)
3. Check session using `getSession()` from `@/lib/auth`
4. Session cookie: `better-auth.session_token`

### Refine-Specific Patterns

1. Use Refine hooks: `useTable`, `useLogout`, `useRefineOptions`, `useActiveAuthProvider`
2. Use `createColumnHelper` from `@tanstack/react-table` for table columns
3. Pre-built components in `@/components/refine-ui/`:
   - Views: `ListView`, `CreateView`, `EditView`, `ShowView`
   - Buttons: `EditButton`, `ShowButton`, `DeleteButton`, `CreateButton`
   - Layout: `Header`, `Sidebar`, `UserAvatar`

### General Conventions

1. Use `const` by default, `let` only when reassignment is needed
2. Prefer `async/await` over Promise chains
3. Use template literals for string interpolation
4. Utility functions from `@/lib/utils`:
   - `formatCurrency(value)` - Format as EUR (pt-PT locale)
   - `formatNumber(value)` - Format numbers (pt-PT locale)
   - `formatDateTime(date)` - Returns `{ dateTime, dateOnly, timeOnly }`
   - `round2(value)` - Round to 2 decimal places
   - `convertToPlainObject(value)` - Convert Prisma objects to plain JS objects
