This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin Dashboard

The application includes a comprehensive admin dashboard for managing users, subscriptions, and credits.

### Access

- **URL**: `/admin`
- **Authentication**: Clerk-based, restricted to admin emails
- **Environment Variable**: Set `ADMIN_EMAILS` to a comma-separated list of admin email addresses

### Features

- **User Management**: View all users with subscription status and credit balances
- **Search & Filter**: Search by email, filter by subscription status
- **User Details**: Detailed view of individual users including:
  - Profile information
  - Subscription management (activate/pause/cancel)
  - Credit management (view history, add credits)
  - Payment history
### Authorization System

The admin system uses a multi-layer security approach:

#### 1. Middleware Protection (`src/proxy.ts`)
- Protects all `/admin/*` routes
- Redirects non-authenticated users to `/`
- Validates admin email against `ADMIN_EMAILS`
- Redirects non-admin users to `/`

#### 2. Server-side Validation (`src/lib/isAdmin.ts`)
- Reusable function for checking admin status
- Used in all admin API routes and pages
- Validates user authentication and email permissions

#### 3. API Route Protection
All `/api/admin/*` routes include:
```ts
const admin = await isAdmin();
if (!admin) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### 4. Page-level Protection
Admin pages use server-side checks:
```ts
const admin = await isAdmin();
if (!admin) {
  redirect('/');
}
```

### Security Notes

- **Never trust client-side validation** - All admin checks happen server-side
- **Environment variables** - Admin emails are server-only, not exposed to client
- **Multi-layer protection** - Middleware + API validation + page checks
- **Audit logging** - Console logs in development for debugging
