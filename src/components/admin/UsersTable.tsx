'use client';

import { AdminUser } from '@/types';
import Link from 'next/link';

interface UsersTableProps {
  users: AdminUser[];
  loading: boolean;
  onUserUpdate: () => void;
}

export function UsersTable({ users, loading }: UsersTableProps) {
  if (loading) {
    return (
      <div className="admin-loader">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-table-container">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table-header-cell">Email</th>
              <th className="admin-table-header-cell">Name</th>
              <th className="admin-table-header-cell">Created</th>
              <th className="admin-table-header-cell">Subscription</th>
              <th className="admin-table-header-cell">Credits</th>
              <th className="admin-table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.fullName || '-'}</td>
                <td className="admin-text-muted">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <span className={`admin-pill ${
                    user.subscriptionStatus === 'authorized'
                      ? 'admin-pill-authorized'
                      : user.subscriptionStatus === 'paused'
                      ? 'admin-pill-paused'
                      : user.subscriptionStatus === 'cancelled'
                      ? 'admin-pill-error'
                      : 'admin-pill-muted'
                  }`}>
                    {user.subscriptionStatus || 'No subscription'}
                  </span>
                </td>
                <td>{user.currentCredits.toLocaleString()}</td>
                <td>
                  <Link href={`/admin/users/${user.id}`} className="admin-link">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="admin-empty">
          No users found
        </div>
      )}
    </div>
  );
}