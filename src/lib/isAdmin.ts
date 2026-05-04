import { currentUser } from '@clerk/nextjs/server';

/**
 * Checks if the current authenticated user is an admin
 * @returns boolean indicating if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser();

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('isAdmin: No authenticated user');
      }
      return false;
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log('isAdmin: User has no primary email');
      }
      return false;
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    if (adminEmails.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('isAdmin: No ADMIN_EMAILS configured');
      }
      return false;
    }

    const isUserAdmin = adminEmails.includes(userEmail);

    if (process.env.NODE_ENV === 'development') {
      console.log(`isAdmin: User ${userEmail} is ${isUserAdmin ? 'admin' : 'not admin'}`);
    }

    return isUserAdmin;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('isAdmin: Error checking admin status:', error);
    }
    return false;
  }
}