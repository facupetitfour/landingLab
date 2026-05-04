'use client';

import { useState } from 'react';
import { AdminUserDetail } from '@/types';

interface SubscriptionManagerProps {
  userId: string;
  subscription: AdminUserDetail['subscription'];
  onUpdate: () => void;
}

export function SubscriptionManager({ userId, subscription, onUpdate }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'activate' | 'pause' | 'cancel') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Subscription Management</h3>

      {subscription ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Status
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                subscription.status === 'authorized'
                  ? 'bg-[var(--success-bg)] text-[var(--success)]'
                  : subscription.status === 'paused'
                  ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                  : 'bg-[var(--error-bg)] text-[var(--error)]'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                MercadoPago ID
              </label>
              <p className="text-[var(--text-primary)] font-mono text-sm">
                {subscription.mpSubscriptionId}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Current Period Start
                </label>
                <p className="text-[var(--text-primary)] text-sm">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Current Period End
                </label>
                <p className="text-[var(--text-primary)] text-sm">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {subscription.status !== 'authorized' && (
              <button
                onClick={() => handleAction('activate')}
                disabled={loading}
                className="px-4 py-2 bg-[var(--success)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Activate'}
              </button>
            )}
            {subscription.status === 'authorized' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={loading}
                className="px-4 py-2 bg-[var(--warning)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Pause'}
              </button>
            )}
            {subscription.status !== 'cancelled' && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={loading}
                className="px-4 py-2 bg-[var(--error)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--text-muted)] mb-4">No subscription found</p>
          <button
            onClick={() => handleAction('activate')}
            disabled={loading}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Grant Premium (Manual)'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}