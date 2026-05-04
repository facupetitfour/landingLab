'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/types';
import { UsersTable } from '@/components/admin/UsersTable';
import { SearchBar } from '@/components/admin/SearchBar';
import { StatusFilter } from '@/components/admin/StatusFilter';

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-heading">Users Management</h1>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      <UsersTable users={users} loading={loading} onUserUpdate={fetchUsers} />
    </div>
  );
}