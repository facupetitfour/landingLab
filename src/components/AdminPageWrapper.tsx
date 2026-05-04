'use client';

import { useIsAdmin } from '@/lib/useIsAdmin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for admin pages
 * Redirects non-admin users and shows loading/fallback states
 */
export function AdminPageWrapper({
  children,
  fallback = <div className="admin-loader">
    <div className="admin-spinner"></div>
  </div>
}: AdminPageWrapperProps) {
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}