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
- **Payments Overview**: Global view of all payments across users
- **Manual Subscription Granting**: Ability to manually activate subscriptions for users

### API Endpoints

- `GET /api/admin/users` - List users with filtering
- `GET /api/admin/users/[id]` - Get detailed user information
- `PATCH /api/admin/subscription` - Manage user subscriptions
- `POST /api/admin/credits` - Add credits to users
- `GET /api/admin/payments` - Get payment records
