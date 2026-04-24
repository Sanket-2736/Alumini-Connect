'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { VerificationStatus } from '@/lib/enums';

interface ProfileUser {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  university: {
    name: string;
    slug: string;
  };
  department: string;
  batch: string;
  workDetails?: {
    company: string;
    jobTitle: string;
    experienceYears: number;
  };
  skills: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  verificationStatus: VerificationStatus;
  createdAt: string;
}

interface ConnectionStatus {
  status: string;
  connectionId?: string;
  user: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Load user profile
        const profileResponse = await fetch(`/api/user/profile/${userId}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileUser(profileData.user);
        }

        // Load connection status (if not viewing own profile)
        if (currentUser && currentUser._id !== userId) {
          const connectionResponse = await fetch(`/api/connections/status/${userId}`);
          if (connectionResponse.ok) {
            const connectionData: ConnectionStatus = await connectionResponse.json();
            setConnectionStatus(connectionData.status);
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId, currentUser]);

  const handleConnect = async () => {
    if (!profileUser) return;

    setConnecting(true);
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profileUser._id }),
      });

      if (response.ok) {
        setConnectionStatus('pending_sent');
      }
    } catch (error) {
      console.error('Connection request failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  const getConnectionButton = () => {
    if (!currentUser || currentUser._id === userId) {
      return (
        <Link
          href="/dashboard/profile"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Edit Profile
        </Link>
      );
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <Link
            href={`/chat/${profileUser?._id}`} // This will be implemented in Prompt 4
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
          >
            Message
          </Link>
        );
      case 'pending_sent':
        return (
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
          >
            Request Sent
          </button>
        );
      case 'pending_received':
        return (
          <Link
            href="/dashboard/connections"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Respond to Request
          </Link>
        );
      default:
        return (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="mt-2 text-gray-600">The user you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/discover"
            className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Discover Alumni
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <img
              src={profileUser.profilePicture || '/default-avatar.png'}
              alt={profileUser.fullName}
              className="h-20 w-20 rounded-full object-cover"
            />
            <div className="ml-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.fullName}</h1>
                {profileUser.verificationStatus === VerificationStatus.APPROVED && (
                  <svg className="ml-2 h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {profileUser.university.name} • {profileUser.batch} • {profileUser.department}
              </p>
              {profileUser.workDetails && (
                <p className="text-gray-600">
                  {profileUser.workDetails.jobTitle} at {profileUser.workDetails.company}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getConnectionButton()}
            {!isOwnProfile && (
              <div className="text-sm text-gray-500">
                {/* Mutual connections count would be implemented here */}
                {/* 0 mutual connections */}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {profileUser.bio && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{profileUser.bio}</p>
            </div>
          )}

          {/* Work Experience */}
          {profileUser.workDetails && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Work Experience</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{profileUser.workDetails.jobTitle}</h3>
                  <p className="text-gray-600">{profileUser.workDetails.company}</p>
                  <p className="text-sm text-gray-500">
                    {profileUser.workDetails.experienceYears} years of experience
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {profileUser.skills.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Education */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Education</h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{profileUser.university.name}</p>
              <p className="text-gray-600">{profileUser.department}</p>
              <p className="text-gray-600">Batch of {profileUser.batch}</p>
            </div>
          </div>

          {/* Social Links */}
          {profileUser.socialLinks && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connect</h2>
              <div className="space-y-2">
                {profileUser.socialLinks.linkedin && (
                  <a
                    href={profileUser.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profileUser.socialLinks.github && (
                  <a
                    href={profileUser.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </a>
                )}
                {profileUser.socialLinks.twitter && (
                  <a
                    href={profileUser.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Verification Status */}
          {isOwnProfile && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h2>
              <div className="flex items-center">
                {profileUser.verificationStatus === VerificationStatus.APPROVED ? (
                  <>
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium">Verified Alumni</span>
                  </>
                ) : profileUser.verificationStatus === VerificationStatus.PENDING ? (
                  <>
                    <svg className="h-5 w-5 text-yellow-500 mr-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-700 font-medium">Under Review</span>
                  </>
                ) : profileUser.verificationStatus === VerificationStatus.REJECTED ? (
                  <>
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium">Verification Rejected</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-medium">Not Verified</span>
                  </>
                )}
              </div>
              <Link
                href="/dashboard/verification"
                className="mt-2 inline-block text-indigo-600 hover:text-indigo-500 text-sm"
              >
                Manage verification
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}