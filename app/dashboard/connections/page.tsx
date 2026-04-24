'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { VerificationStatus } from '@/lib/enums';

interface ConnectionUser {
  _id: string;
  fullName: string;
  profilePicture?: string;
  university: {
    name: string;
    slug: string;
  };
  department: string;
  batch: string;
  workDetails?: {
    company: string;
    jobTitle: string;
  };
  skills: string[];
  verificationStatus: VerificationStatus;
}

interface Connection {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: ConnectionUser;
  isRequester: boolean;
}

interface ConnectionsResponse {
  connections: Connection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ConnectionsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my' | 'pending' | 'sent'>('my');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadConnections = async (status?: string) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`/api/connections/my${params}`);
      if (response.ok) {
        const data: ConnectionsResponse = await response.json();
        setConnections(data.connections);

        // Count pending received requests
        if (!status) {
          const pendingReceived = data.connections.filter(
            conn => conn.status === 'pending' && !conn.isRequester
          ).length;
          setPendingCount(pendingReceived);
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/accept`, {
        method: 'PUT',
      });

      if (response.ok) {
        loadConnections();
      }
    } catch (error) {
      console.error('Failed to accept connection:', error);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        loadConnections();
      }
    } catch (error) {
      console.error('Failed to reject connection:', error);
    }
  };

  const handleWithdraw = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadConnections();
      }
    } catch (error) {
      console.error('Failed to withdraw connection:', error);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadConnections();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getTabConnections = () => {
    switch (activeTab) {
      case 'pending':
        return connections.filter(conn => conn.status === 'pending' && !conn.isRequester);
      case 'sent':
        return connections.filter(conn => conn.status === 'pending' && conn.isRequester);
      case 'my':
      default:
        return connections.filter(conn => conn.status === 'accepted');
    }
  };

  const getActionButtons = (connection: Connection) => {
    switch (activeTab) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAccept(connection.id)}
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(connection.id)}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        );
      case 'sent':
        return (
          <button
            onClick={() => handleWithdraw(connection.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Withdraw
          </button>
        );
      case 'my':
      default:
        return (
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/profile/${connection.user._id}`}
              className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Message
            </Link>
            <button
              onClick={() => handleDisconnect(connection.id)}
              className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        );
    }
  };

  if (!user) return <div>Loading...</div>;

  const tabConnections = getTabConnections();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Connections ({connections.filter(c => c.status === 'accepted').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Requests
              {pendingCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sent Requests ({connections.filter(c => c.status === 'pending' && c.isRequester).length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading connections...</p>
          </div>
        ) : tabConnections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'my' && 'No connections yet'}
              {activeTab === 'pending' && 'No pending requests'}
              {activeTab === 'sent' && 'No sent requests'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'my' && 'Start connecting with alumni to build your network!'}
              {activeTab === 'pending' && 'Connection requests from others will appear here.'}
              {activeTab === 'sent' && 'Your pending connection requests will appear here.'}
            </p>
            {activeTab === 'my' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/discover"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Discover Alumni
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tabConnections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={connection.user.profilePicture || '/default-avatar.png'}
                      alt={connection.user.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{connection.user.fullName}</h3>
                        {connection.user.verificationStatus === VerificationStatus.APPROVED && (
                          <svg className="ml-2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {connection.user.university.name} • {connection.user.batch} • {connection.user.department}
                      </p>
                      {connection.user.workDetails && (
                        <p className="text-sm text-gray-600">
                          {connection.user.workDetails.jobTitle} at {connection.user.workDetails.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getActionButtons(connection)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}