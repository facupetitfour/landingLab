'use client';

import { useState, useEffect } from 'react';
import { PaymentRecord } from '@/types';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');

      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-heading">Payments Overview</h1>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loader">
            <div className="admin-spinner"></div>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Date</th>
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
                      {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payments.length === 0 && !loading && (
          <div className="admin-empty">
            No payments found
          </div>
        )}
      </div>
    </div>
  );
}