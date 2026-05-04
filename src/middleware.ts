import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/project(.*)',
  '/api/chat(.*)',
  '/api/projects(.*)',
  '/api/edit(.*)',
  '/api/generate(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect regular authenticated routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Special handling for admin routes
  if (isAdminRoute(request)) {
    // First ensure user is authenticated
    await auth.protect();

    // Then check if user is admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get user to check email
    const { user } = await auth();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: Admin route accessed by user without email');
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    if (!adminEmails.includes(userEmail)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Non-admin user ${userEmail} tried to access admin route`);
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    // User is admin, allow access
    if (process.env.NODE_ENV === 'development') {
      console.log(`Middleware: Admin user ${userEmail} accessing admin route`);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};