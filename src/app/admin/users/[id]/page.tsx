'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdminUserDetail } from '@/types';
import { UserProfile } from '@/components/admin/UserProfile';
import { SubscriptionManager } from '@/components/admin/SubscriptionManager';
import { CreditsManager } from '@/components/admin/CreditsManager';
import { PaymentsTable } from '@/components/admin/PaymentsTable';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="admin-loader">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="admin-alert admin-alert-error">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header admin-card-section">
        <button
          onClick={() => window.history.back()}
          className="admin-button admin-button-muted"
        >
          ← Back to Users
        </button>
        <h1 className="admin-heading">User Details</h1>
      </div>

      <UserProfile user={user} />

      <div className="admin-grid-2">
        <SubscriptionManager
          userId={user.id}
          subscription={user.subscription}
          onUpdate={fetchUser}
        />
        <CreditsManager
          userId={user.id}
          currentCredits={user.currentCredits}
          creditsHistory={user.creditsHistory}
          onUpdate={fetchUser}
        />
      </div>

      <PaymentsTable payments={user.payments} />
    </div>
  );
}