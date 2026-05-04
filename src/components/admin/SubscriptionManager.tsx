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
    <div className="admin-card admin-card--padded">
      <h3 className="admin-card-title">Subscription Management</h3>

      {subscription ? (
        <div className="admin-card-section">
          <div className="admin-meta-grid">
            <div>
              <label className="admin-label">Status</label>
              <span className={`admin-pill ${
                subscription.status === 'authorized'
                  ? 'admin-pill-authorized'
                  : subscription.status === 'paused'
                  ? 'admin-pill-paused'
                  : 'admin-pill-error'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div>
              <label className="admin-label">MercadoPago ID</label>
              <p className="admin-text-secondary" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {subscription.mpSubscriptionId}
              </p>
            </div>
            <div>
              <label className="admin-label">Current Period Start</label>
              <p className="admin-text-secondary" style={{ fontSize: '0.9rem' }}>
                {new Date(subscription.currentPeriodStart).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="admin-label">Current Period End</label>
              <p className="admin-text-secondary" style={{ fontSize: '0.9rem' }}>
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="admin-button-group">
            {subscription.status !== 'authorized' && (
              <button
                onClick={() => handleAction('activate')}
                disabled={loading}
                className="admin-button admin-button-success"
              >
                {loading ? 'Updating...' : 'Activate'}
              </button>
            )}
            {subscription.status === 'authorized' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={loading}
                className="admin-button admin-button-warning"
              >
                {loading ? 'Updating...' : 'Pause'}
              </button>
            )}
            {subscription.status !== 'cancelled' && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={loading}
                className="admin-button admin-button-danger"
              >
                {loading ? 'Updating...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-card-section" style={{ textAlign: 'center' }}>
          <p className="admin-text-muted" style={{ marginBottom: '1rem' }}>No subscription found</p>
          <button
            onClick={() => handleAction('activate')}
            disabled={loading}
            className="admin-button admin-button-primary"
          >
            {loading ? 'Creating...' : 'Grant Premium (Manual)'}
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}