'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalUsers: number;
  totalUniversities: number;
  totalPosts: number;
  totalJobs: number;
  verifiedUsers: number;
  pendingVerifications: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('🔐 Dashboard - Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN FOUND');
        console.log('🔐 All localStorage:', {
          accessToken: localStorage.getItem('accessToken')?.substring(0, 20) + '...',
          userRole: localStorage.getItem('userRole'),
          adminEmail: localStorage.getItem('adminEmail'),
        });

        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        console.log('📤 Sending request to /api/admin/stats with headers:', {
          'Authorization': `Bearer ${token.substring(0, 20)}...`,
        });

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ Error response:', errorData);
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Stats response:', data);
        setStats(data.data);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 12a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Verified Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Verified Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.verifiedUsers || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Verifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.pendingVerifications || 0}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Universities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Universities</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalUniversities || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalPosts || 0}
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalJobs || 0}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A2.25 2.25 0 1015.5 13v.5a.75.75 0 001.5 0v-.5a3.75 3.75 0 10-7.5 0v.5a.75.75 0 001.5 0V11.5a2.25 2.25 0 00-2.25-2.25H6a2 2 0 00-2 2v3a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2V5a1 1 0 00-1-1H9a1 1 0 00-1 1v1H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
