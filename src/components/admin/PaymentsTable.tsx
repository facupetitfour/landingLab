'use client';

import { PaymentRecord } from '@/types';

interface PaymentsTableProps {
  payments: PaymentRecord[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <div className="admin-card admin-card--padded">
      <h3 className="admin-card-title">Payment History</h3>

      {payments.length === 0 ? (
        <p className="admin-text-muted">No payments found</p>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-table-header-cell">User</th>
                <th className="admin-table-header-cell">Amount</th>
                <th className="admin-table-header-cell">Currency</th>
                <th className="admin-table-header-cell">Status</th>
                <th className="admin-table-header-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.userEmail || '-'}</td>
                  <td>{payment.amount.toLocaleString()}</td>
                  <td>{payment.currency.toUpperCase()}</td>
                  <td>
                    <span className={`admin-pill ${
                      payment.status === 'approved'
                        ? 'admin-pill-authorized'
                        : payment.status === 'pending'
                        ? 'admin-pill-pending'
                        : 'admin-pill-error'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="admin-text-muted">
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