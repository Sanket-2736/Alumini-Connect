'use client';

import { useAuthStore } from '@/lib/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to your Dashboard, {user?.fullName}!
          </h2>
          <p className="text-gray-600 mb-6">
            This is where you'll find your alumni network features, job opportunities, and more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profile</h3>
              <p className="text-gray-600 mb-4">Manage your professional profile and connect with alumni.</p>
              <a
                href="/dashboard/profile"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Profile →
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Network</h3>
              <p className="text-gray-600 mb-4">Connect with fellow alumni and expand your network.</p>
              <span className="text-gray-400 font-medium">Coming Soon</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Opportunities</h3>
              <p className="text-gray-600 mb-4">Discover job opportunities and career resources.</p>
              <span className="text-gray-400 font-medium">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}