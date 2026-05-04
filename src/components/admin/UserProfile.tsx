'use client';

import { AdminUserDetail } from '@/types';

interface UserProfileProps {
  user: AdminUserDetail;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="admin-card admin-card--padded">
      <h2 className="admin-card-title">Profile Information</h2>
      <div className="admin-meta-grid">
        <div>
          <label className="admin-label">Email</label>
          <p>{user.email}</p>
        </div>
        <div>
          <label className="admin-label">Full Name</label>
          <p>{user.fullName || '-'}</p>
        </div>
        <div>
          <label className="admin-label">Created At</label>
          <p>{new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}</p>
        </div>
        <div>
          <label className="admin-label">Current Credits</label>
          <p className="admin-text-secondary" style={{ fontWeight: 600 }}>
            {user.currentCredits.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}