'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface VerificationDoc {
  userId: string;
  fullName: string;
  email: string;
  university: string;
  department: string;
  batch: string;
  role: string;
  verificationDocs: string[];
  verificationStatus: string;
  createdAt: string;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<VerificationDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/verifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch verifications: ${response.status}`);
      }

      const data = await response.json();
      setVerifications(data.data || []);
    } catch (err: any) {
      console.error('Error fetching verifications:', err);
      setError(err.message || 'Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve verification');
      }

      toast.success('User approved successfully');
      setSelectedUser(null);
      fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject verification');
      }

      toast.success('User rejected successfully');
      setSelectedUser(null);
      setRejectionReason('');
      fetchVerifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject verification');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading verifications...</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">User Verifications</h1>

      {verifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No users with documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verifications.map((verification) => (
            <div
              key={verification.userId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
              onClick={() => setSelectedUser(verification)}
            >
              {}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white">
                <h3 className="text-lg font-semibold truncate">{verification.fullName}</h3>
                <p className="text-blue-100 text-sm">{verification.email}</p>
              </div>

              {}
              <div className="px-6 py-4">
                <div className="space-y-3 mb-4">
                  {}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">University</p>
                    <p className="text-sm font-medium text-gray-900">{verification.university}</p>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Department</p>
                      <p className="text-sm font-medium text-gray-900">{verification.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Batch</p>
                      <p className="text-sm font-medium text-gray-900">{verification.batch}</p>
                    </div>
                  </div>

                  {}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Role</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{verification.role}</p>
                  </div>

                  {}
                  <div className="pt-2 border-t border-gray-200">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      verification.verificationStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : verification.verificationStatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : verification.verificationStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {verification.verificationStatus.charAt(0).toUpperCase() + verification.verificationStatus.slice(1)}
                    </span>
                  </div>

                  {}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(verification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Documents</p>
                    <p className="text-sm font-medium text-gray-900">
                      {verification.verificationDocs.length} file{verification.verificationDocs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(verification);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                >
                  Review Documents
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Verify: {selectedUser.fullName}
                </h2>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">User Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900">{selectedUser.role}</p>
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
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Verification Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.verificationDocs.map((docUrl, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      {docUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="bg-red-50 p-8 flex items-center justify-center h-64">
                          <div className="text-center">
                            <p className="text-red-600 font-semibold mb-2">PDF Document</p>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 underline"
                            >
                              Open PDF
                            </a>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={docUrl}
                          alt={`Verification document ${index + 1}`}
                          className="w-full h-64 object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedUser.verificationStatus === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the documents are being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                </div>
              )}

              {}
              {selectedUser.verificationStatus === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedUser.userId)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.userId)}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}

              {selectedUser.verificationStatus !== 'pending' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold text-gray-900">{selectedUser.verificationStatus}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
