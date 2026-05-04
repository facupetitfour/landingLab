'use client';

import { AdminUserDetail } from '@/types';

interface UserProfileProps {
  user: AdminUserDetail;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Email
          </label>
          <p className="text-[var(--text-primary)]">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Full Name
          </label>
          <p className="text-[var(--text-primary)]">{user.fullName || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Created At
          </label>
          <p className="text-[var(--text-primary)]">
            {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Current Credits
          </label>
          <p className="text-[var(--text-primary)] font-semibold">
            {user.currentCredits.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}