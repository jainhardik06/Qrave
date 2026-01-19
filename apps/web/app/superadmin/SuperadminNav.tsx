'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SuperadminNav() {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/superadmin" className="text-xl font-semibold text-gray-900">
              Qrave Superadmin
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/superadmin" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/superadmin/tenants" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Tenants
              </Link>
              <Link href="/superadmin/users" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Users
              </Link>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
