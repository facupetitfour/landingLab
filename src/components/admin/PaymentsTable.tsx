'use client';

import { PaymentRecord } from '@/types';

interface PaymentsTableProps {
  payments: PaymentRecord[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Payment History</h3>

      {payments.length === 0 ? (
        <p className="text-[var(--text-muted)]">No payments found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-elevated)]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-surface)]">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {payment.userEmail || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {payment.currency.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'approved'
                        ? 'bg-[var(--success-bg)] text-[var(--success)]'
                        : payment.status === 'pending'
                        ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                        : 'bg-[var(--error-bg)] text-[var(--error)]'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}