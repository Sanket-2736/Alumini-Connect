'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface DetailedStats {
  totalUsers: number;
  totalUniversities: number;
  totalPosts: number;
  totalJobs: number;
  verifiedUsers: number;
  pendingVerifications: number;
  bannedUsers: number;
  activeUsers: number;
  studentCount: number;
  alumniCount: number;
  totalConnections: number;
  totalMessages: number;
  totalGroups: number;
  usersByUniversity: Array<{ university: string; count: number }>;
  usersByVerificationStatus: Array<{ status: string; count: number }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-12">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistics</h1>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Active Users</p>
            <p className="text-2xl font-bold text-green-600">{stats?.activeUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Banned Users</p>
            <p className="text-2xl font-bold text-red-600">{stats?.bannedUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Verified Users</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.verifiedUsers}</p>
          </div>
        </div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Students</p>
            <p className="text-2xl font-bold text-indigo-600">{stats?.studentCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Alumni</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.alumniCount}</p>
          </div>
        </div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Pending Verifications</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingVerifications}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Verified</p>
            <p className="text-2xl font-bold text-green-600">{stats?.verifiedUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Universities</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalUniversities}</p>
          </div>
        </div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Posts</p>
            <p className="text-2xl font-bold text-indigo-600">{stats?.totalPosts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Jobs</p>
            <p className="text-2xl font-bold text-orange-600">{stats?.totalJobs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Connections</p>
            <p className="text-2xl font-bold text-green-600">{stats?.totalConnections}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Messages</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalMessages}</p>
          </div>
        </div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat Statistics</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Groups</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.totalGroups}</p>
        </div>
      </div>

      {}
      {stats?.usersByUniversity && stats.usersByUniversity.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users by University</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.usersByUniversity.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.university}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
