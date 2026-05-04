'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Client-side hook to check if current user is admin
 * Note: This should NOT be used for security-critical operations
 * Always validate admin status on the server side
 */
export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsAdmin(false);
      return;
    }

    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      setIsAdmin(false);
      return;
    }

    // Note: This is client-side only and should not be trusted for security
    // The admin emails are not available on the client side for security reasons
    // This hook is mainly for UI state management
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    setIsAdmin(adminEmails.includes(userEmail));
  }, [user, isLoaded]);

  return {
    isAdmin,
    isLoading: !isLoaded
  };
}