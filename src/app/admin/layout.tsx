import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/isAdmin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--bg-surface)]">
          <div className="p-6">
            <h1 className="text-xl font-bold text-[var(--accent-primary)]">Admin Dashboard</h1>
          </div>
          <nav className="px-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/admin"
                  className="block px-4 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Users
                </a>
              </li>
              <li>
                <a
                  href="/admin/payments"
                  className="block px-4 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Payments
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}