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

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
This project does not have tests configured yet. When adding tests:
- Use Vitest or Jest with @testing-library/react for Next.js compatibility
- Run single test: `npm test -- path/to/test.test.ts`
- Run tests in watch mode: `npm test -- --watch`
- Run tests matching pattern: `npm test -- --testNamePattern="test name"`

### Security
- Next.js configured with security headers (HSTS, XSS protection, frame options)
- API routes protected by middleware (except /api/auth/*)
- Session cookie: `better-auth.session_token`
- Always validate user sessions with `getSession()` in API routes

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

### Component Structure

1. Use function components with named exports
2. Destructure props at function signature: `function Button({ className, variant, ...props }: Props) {`
3. Use `React.ComponentProps<"button">` for extending native element props
4. Set `displayName` on exported components: `Header.displayName = "Header";`
5. Use `React.forwardRef` for composable components that need ref forwarding
6. Client components must include `'use client';` at the very top
7. Define props types inline or above component: `type Props = { ... };`

### TypeScript

1. Always use strict TypeScript features enabled in `tsconfig.json`:
   - `strict: true`
   - `forceConsistentCasingInFileNames: true`
   - Proper type imports with `import type`

2. Use `Readonly` for immutable props (Next.js default)
3. Use utility types for component props: `type Props = Readonly<{ ... }>;`

### Styling

1. Use `cn()` utility from `@/lib/utils` for className merging (`clsx` + `tailwind-merge`)
2. Prefer shadcn/ui components and extend them via variants
3. Use class-variance-authority (cva) for component variants
4. Use lowercase, hyphenated Tailwind utility classes

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
   - `apiError(error, status, message?, details?)` - error responses
   - `apiListSuccess(data, total, status?)` - paginated list responses
   - `validateQueryParams(searchParams, schema)` - query validation
   - `handleValidationError(error)` - Zod error formatting
2. Always validate sessions with `getSession()` from `@/lib/auth`
3. Use Prisma transactions for atomic operations: `prisma.$transaction([...])`
4. Return meaningful HTTP status codes via `HttpStatusCode` enum
5. **WARNING**: `validateQueryParams` has hardcoded field mappings (page, size, name, clubName) - extend if needed
6. Always wrap handlers in try/catch: `apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR)` on errors

### Validation (Zod)

1. All validators are in `@/lib/validators.ts`
2. Use `z.coerce` for query params (strings to numbers/dates)
3. Use `z.preprocess` for complex type transformations (e.g., string with comma to float)
4. Use `.refine()` for simple cross-field validation
5. Use `.transform()` for data mutations during validation
6. Use `.superRefine()` for complex conditional validation with multiple fields
7. Example patterns:
   - `.refine((data) => data.password === data.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })`
   - `.transform((data) => data.players !== 11 ? { ...data, aRate: 0 } : data)`
   - `.superRefine((data, ctx) => { if (data.countB > 0 && !data.durationB) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duration B required', path: ['durationB'] }); } })`

### Error Handling

1. Always wrap API handlers in try/catch blocks
2. Use `apiError()` for standardized error responses (automatically logs 5xx errors)
3. Use `HttpStatusCode` enum for status codes
4. Use `handleValidationError()` for Zod validation errors
5. Log errors with `console.error()` for debugging (use proper logging in production)

### Authentication (better-auth)

1. Auth utilities in `@/lib/auth`, middleware protects `/api/*` (except `/api/auth/*`)
2. Check sessions with `getSession()` from `@/lib/auth`
3. Session cookie: `better-auth.session_token`
4. Available auth functions: `updateUser`, `updateUserPassword`, `createUser`, `deleteUser`
5. Admin plugin enabled with default role 'admin'

### Refine-Specific Patterns

1. Use Refine hooks: `useTable`, `useLogout`, `useRefineOptions`, `useActiveAuthProvider`
2. Use `createColumnHelper` from `@tanstack/react-table` for table columns
3. Pre-built components in `@/components/refine-ui/`: `ListView`, `CreateView`, `EditView`, `ShowView`, `EditButton`, `ShowButton`, `DeleteButton`, `CreateButton`, `Header`, `Sidebar`, `UserAvatar`

### React Patterns

1. Use `PropsWithChildren` from React for components that accept children
2. Use `type Props = Readonly<...>` pattern for component props
3. Export both component and sub-components: `export { ListView, ListViewHeader };`
4. Use `asChild` pattern for compositional components (Radix UI pattern)

### General Conventions

1. Use `const` by default, `let` only when reassignment is needed
2. Prefer `async/await` over Promise chains
3. Use template literals for string interpolation
4. Utility functions from `@/lib/utils`: `formatCurrency()`, `formatNumber()`, `formatDateTime()`, `round2()`, `convertToPlainObject()`
5. All formatting uses `pt-PT` locale (EUR currency, Portuguese date/number formats)
6. Icons from `lucide-react` (e.g., `<Eye className="h-4 w-4" />`)
