'use client';

import { useState } from 'react';
import { CreditTransaction } from '@/types';

interface CreditsManagerProps {
  userId: string;
  currentCredits: number;
  creditsHistory: CreditTransaction[];
  onUpdate: () => void;
}

export function CreditsManager({ userId, currentCredits, creditsHistory, onUpdate }: CreditsManagerProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCredits = async () => {
    const creditAmount = parseInt(amount);
    if (!creditAmount || creditAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: creditAmount,
          reason: 'bonus'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add credits');
      }

      setAmount('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card admin-card--padded">
      <h3 className="admin-card-title">Credits Management</h3>

      <div className="admin-card-section">
        <div className="admin-meta-grid" style={{ alignItems: 'center' }}>
          <div>
            <span className="admin-label">Current Balance</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="admin-heading" style={{ fontSize: '1.5rem' }}>
              {currentCredits.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="admin-button-group" style={{ gap: '0.75rem' }}>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="admin-input"
          />
          <button
            onClick={handleAddCredits}
            disabled={loading || !amount}
            className="admin-button admin-button-primary"
          >
            {loading ? 'Adding...' : 'Add Credits'}
          </button>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
      </div>

      <div>
        <h4 className="admin-card-title">Credit History</h4>
        <div className="admin-history-list">
          {creditsHistory.length === 0 ? (
            <p className="admin-text-muted">No credit transactions</p>
          ) : (
            creditsHistory.map((transaction) => (
              <div key={transaction.id} className="admin-history-row">
                <div>
                  <span className={transaction.amount > 0 ? 'admin-pill admin-pill-authorized' : 'admin-pill admin-pill-error'}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </span>
                  <span className="admin-text-muted" style={{ marginLeft: '0.5rem' }}>
                    {transaction.reason.replace('_', ' ')}
                  </span>
                </div>
                <span className="admin-text-muted">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}