'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/authStore';

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

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, []);

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
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
    }
  };

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

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No recommendations available at this time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.userId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* Header with match score */}
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

              {/* Profile Picture */}
              {rec.profilePicture && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={rec.profilePicture}
                    alt={rec.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-4">
                {/* Match Reasons */}
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

                {/* Details */}
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

                {/* Bio */}
                {rec.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{rec.bio}</p>
                )}

                {/* Skills */}
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

                {/* Action Button */}
                <button
                  onClick={() => handleSendRequest(rec.userId)}
                  disabled={sentRequests.has(rec.userId)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                    sentRequests.has(rec.userId)
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {sentRequests.has(rec.userId) ? '✓ Request Sent' : 'Send Connection Request'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
