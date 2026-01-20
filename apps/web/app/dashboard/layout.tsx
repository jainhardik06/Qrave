'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/menu', label: 'Menu' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/staff', label: 'Staff' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'SUPERADMIN') {
        router.replace('/superadmin');
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('role');
      router.replace('/login');
    }
  }, [router]);

  const activeHref = useMemo(() => {
    const match = navItems.find((item) => pathname?.startsWith(item.href));
    return match?.href;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="text-lg font-semibold text-slate-900">Qrave Tenant</div>
            <p className="text-sm text-slate-500">Manage your restaurant</p>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur">
            <div>
              <p className="text-sm text-slate-500">Tenant Dashboard</p>
              <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
            </div>
            <div className="text-sm text-slate-500">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('tenant_id');
                  localStorage.removeItem('role');
                  router.replace('/login');
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
