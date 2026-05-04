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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-elevated)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-surface)]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--bg-elevated)]">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {user.fullName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.subscriptionStatus === 'authorized'
                      ? 'bg-[var(--success-bg)] text-[var(--success)]'
                      : user.subscriptionStatus === 'paused'
                      ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
                      : user.subscriptionStatus === 'cancelled'
                      ? 'bg-[var(--error-bg)] text-[var(--error)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}>
                    {user.subscriptionStatus || 'No subscription'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {user.currentCredits.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] mr-4"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          No users found
        </div>
      )}
    </div>
  );
}