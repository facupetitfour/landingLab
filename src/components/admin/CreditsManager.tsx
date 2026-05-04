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
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Credits Management</h3>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Current Balance</span>
          <span className="text-2xl font-bold text-[var(--accent-primary)]">
            {currentCredits.toLocaleString()}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--bg-surface)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
          <button
            onClick={handleAddCredits}
            disabled={loading || !amount}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Credits'}
          </button>
        </div>

        {error && (
          <div className="mt-2 bg-[var(--error-bg)] border border-[var(--error)] text-[var(--error)] px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-md font-medium mb-3">Credit History</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {creditsHistory.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">No credit transactions</p>
          ) : (
            creditsHistory.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-2 px-3 bg-[var(--bg-primary)] rounded">
                <div>
                  <span className={`font-medium ${transaction.amount > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </span>
                  <span className="text-[var(--text-secondary)] text-sm ml-2">
                    {transaction.reason.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[var(--text-muted)] text-sm">
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