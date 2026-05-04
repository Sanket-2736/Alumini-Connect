'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');

    // If on login page, don't check authentication
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    // For other admin pages, check authentication
    if (!token || role !== 'admin') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  // If on login page, just render children without layout
  if (pathname === '/admin/login') {
    return children;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <nav className="mt-6 space-y-2 px-4">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/verifications"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Verifications
          </Link>
          <Link
            href="/admin/universities"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Universities
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Users
          </Link>
          <Link
            href="/admin/stats"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Statistics
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
