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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
        >
          ← Back to Users
        </button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <UserProfile user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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