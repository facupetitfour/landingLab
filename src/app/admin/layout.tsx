import './admin.css';
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
    <div className="admin-shell">
      <div className="admin-row">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-inner">
            <h1 className="admin-sidebar-title">Admin Dashboard</h1>
          </div>
          <nav className="admin-nav">
            <ul className="admin-nav-list">
              <li className="admin-nav-item">
                <a href="/admin" className="admin-nav-link">
                  Users
                </a>
              </li>
              <li className="admin-nav-item">
                <a href="/admin/payments" className="admin-nav-link">
                  Payments
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}