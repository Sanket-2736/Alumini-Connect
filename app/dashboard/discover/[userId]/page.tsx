'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  university: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  department: string;
  batch: string;
  role: string;
  skills: string[];
  workDetails?: {
    company: string;
    jobTitle: string;
    experienceYears: number;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'rejected'>('none');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkConnectionStatus();
  }, [params.userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile/${params.userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data.data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/connections/status/${params.userId}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.data?.status || 'none');
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  const handleSendRequest = async () => {
    setSendingRequest(true);
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: params.userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send connection request');
      }

      setConnectionStatus('pending');
      toast.success('Connection request sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send connection request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-indigo-600 hover:text-indigo-900"
        >
          ← Back
        </button>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-indigo-600 hover:text-indigo-900 font-medium"
      >
        ← Back to Discover
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        {/* Cover Background */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 mb-6">
            {/* Profile Picture */}
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.fullName}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center">
                <span className="text-4xl text-gray-600">
                  {profile.fullName.charAt(0)}
                </span>
              </div>
            )}

            <div className="mt-4 md:mt-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-lg text-gray-600 capitalize">{profile.role}</p>
              {profile.workDetails && (
                <p className="text-gray-600">
                  {profile.workDetails.jobTitle} at {profile.workDetails.company}
                </p>
              )}
            </div>

            {/* Connection Button */}
            {currentUser?._id !== profile._id && (
              <button
                onClick={handleSendRequest}
                disabled={sendingRequest || connectionStatus !== 'none'}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  connectionStatus === 'connected'
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : connectionStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {connectionStatus === 'connected'
                  ? '✓ Connected'
                  : connectionStatus === 'pending'
                  ? '⏳ Request Pending'
                  : sendingRequest
                  ? 'Sending...'
                  : 'Connect'}
              </button>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-700 mb-6">{profile.bio}</p>
          )}

          {/* University Info */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
            {profile.university.logoUrl && (
              <img
                src={profile.university.logoUrl}
                alt={profile.university.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <p className="text-sm text-gray-600">University</p>
              <p className="font-semibold text-gray-900">{profile.university.name}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{profile.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch</p>
              <p className="font-semibold text-gray-900">{profile.batch}</p>
            </div>
            {profile.workDetails && (
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-semibold text-gray-900">
                  {profile.workDetails.experienceYears} years
                </p>
              </div>
            )}
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
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

          {/* Social Links */}
          {profile.socialLinks && (
            Object.values(profile.socialLinks).some(link => link) && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
                <div className="flex space-x-4">
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      LinkedIn
                    </a>
                  )}
                  {profile.socialLinks.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-gray-600 font-medium"
                    >
                      GitHub
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600 font-medium"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
