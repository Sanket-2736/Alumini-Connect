'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Recommendation {
  userId: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  university: string;
  department: string;
  batch: string;
  role: string;
  bio?: string;
  skills: string[];
  score: number;
  matchReasons: string[];
}

interface Connection {
  id: string;
  status: string;
  user: {
    _id: string;
  };
}

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<Recommendation | null>(null);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    university: '',
    batch: '',
    department: '',
    role: '',
    searchTerm: '',
  });

  const universities = [...new Set(recommendations.map(r => r.university))];
  const batches = [...new Set(recommendations.map(r => r.batch))];
  const departments = [...new Set(recommendations.map(r => r.department))];

  useEffect(() => {
    fetchRecommendations();
    fetchConnections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, recommendations]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/connections/recommendations');
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      setRecommendations(data.data || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections/my?status=accepted');
      if (response.ok) {
        const data = await response.json();
        const connectedIds = new Set<string>(
          (data.data?.connections || data.connections || []).map((conn: Connection) => conn.user._id)
        );
        setConnections(connectedIds);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const applyFilters = () => {
    let filtered = recommendations;

    if (filters.university) {
      filtered = filtered.filter(r => r.university === filters.university);
    }
    if (filters.batch) {
      filtered = filtered.filter(r => r.batch === filters.batch);
    }
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department);
    }
    if (filters.role) {
      filtered = filtered.filter(r => r.role === filters.role);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    }

    setFilteredRecommendations(filtered);
  };

  const handleSendRequest = async (recipientId: string) => {
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }

      setSentRequests(prev => new Set([...prev, recipientId]));
      toast.success('Connection request sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request');
    }
  };

  const isConnected = (userId: string) => connections.has(userId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discover & Connect</h1>
        <p className="mt-2 text-gray-600">
          Find and connect with alumni and students from your university
        </p>
      </div>

      {}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Name/Email
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              University
            </label>
            <select
              value={filters.university}
              onChange={(e) => setFilters({ ...filters, university: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Universities</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch/Year
            </label>
            <select
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Batches</option>
              {batches.sort().reverse().map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        {}
        {Object.values(filters).some(v => v) && (
          <button
            onClick={() => setFilters({ university: '', batch: '', department: '', role: '', searchTerm: '' })}
            className="mt-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {}
      <div className="mb-4 text-gray-600">
        Showing {filteredRecommendations.length} of {recommendations.length} recommendations
      </div>

      {}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No recommendations match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.userId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
              onClick={() => setSelectedUser(rec)}
            >
              {}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{rec.fullName}</h3>
                    <p className="text-indigo-100 text-sm">{rec.role}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <p className="text-sm font-semibold">{rec.score}% Match</p>
                  </div>
                </div>
              </div>

              {}
              {rec.profilePicture && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={rec.profilePicture}
                    alt={rec.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {}
              <div className="px-6 py-4">
                {}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {rec.matchReasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-gray-900">University:</span> {rec.university}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Department:</span> {rec.department}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Batch:</span> {rec.batch}
                  </p>
                </div>

                {}
                {rec.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{rec.bio}</p>
                )}

                {}
                {rec.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-900 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {rec.skills.length > 3 && (
                        <span className="inline-block text-gray-600 text-xs px-2 py-1">
                          +{rec.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {}
                {isConnected(rec.userId) ? (
                  <Link
                    href={`/dashboard/messages?userId=${rec.userId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block w-full py-2 px-4 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700 text-center"
                  >
                    💬 Send Message
                  </Link>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendRequest(rec.userId);
                    }}
                    disabled={sentRequests.has(rec.userId)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                      sentRequests.has(rec.userId)
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {sentRequests.has(rec.userId) ? '✓ Request Sent' : 'Send Connection Request'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedUser.fullName}</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {}
              {selectedUser.profilePicture && (
                <div className="relative h-64 bg-gray-200 rounded-lg mb-6 overflow-hidden">
                  <img
                    src={selectedUser.profilePicture}
                    alt={selectedUser.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">University</p>
                    <p className="font-medium text-gray-900">{selectedUser.university}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{selectedUser.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Batch</p>
                    <p className="font-medium text-gray-900">{selectedUser.batch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="font-medium text-indigo-600">{selectedUser.score}%</p>
                  </div>
                </div>
              </div>

              {}
              {selectedUser.bio && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700">{selectedUser.bio}</p>
                </div>
              )}

              {}
              {selectedUser.skills.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Why Recommended</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.matchReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              </div>

              {}
              <div className="flex gap-3">
                {isConnected(selectedUser.userId) ? (
                  <>
                    <Link
                      href={`/dashboard/messages?userId=${selectedUser.userId}`}
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 py-2 px-4 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700 text-center"
                    >
                      💬 Send Message
                    </Link>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleSendRequest(selectedUser.userId);
                        setSelectedUser(null);
                      }}
                      disabled={sentRequests.has(selectedUser.userId)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        sentRequests.has(selectedUser.userId)
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {sentRequests.has(selectedUser.userId) ? '✓ Request Sent' : 'Send Connection Request'}
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
