'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/authStore';

interface VideoCall {
  _id: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  sessionId: string;
  alumniId: { _id: string; fullName: string; profilePicture?: string };
  studentId: { _id: string; fullName: string; profilePicture?: string };
}

export default function VideoCallsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<VideoCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCalls();
  }, [filter]);

  const fetchCalls = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`/api/video-calls${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCalls(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Failed to load video calls');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCall = (call: VideoCall) => {
    const isAlumni = user?.role === 'alumni';
    const role = isAlumni ? 'initiator' : 'participant';
    const remoteUser = isAlumni ? call.studentId : call.alumniId;

    router.push(
      `/dashboard/video-calls/${call._id}?sessionId=${call.sessionId}&role=${role}&remoteName=${remoteUser.fullName}`
    );
  };

  const handleDeleteCall = async (callId: string) => {
    if (!window.confirm('Are you sure you want to cancel this call?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/video-calls/${callId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Call cancelled');
      fetchCalls();
    } catch (error) {
      toast.error('Failed to cancel call');
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Calls</h1>
          <p className="text-gray-600 mt-1">Manage your scheduled video calls</p>
        </div>
        {user?.role === 'alumni' && (
          <button
            onClick={() => router.push('/dashboard/video-calls/schedule')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={20} />
            Schedule Call
          </button>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'scheduled', 'ongoing', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Calls Grid */}
      {calls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Video size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No video calls found</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calls.map((call, idx) => (
            <motion.div
              key={call._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <h3 className="font-semibold text-lg truncate">{call.title}</h3>
                <p className="text-indigo-100 text-sm">
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </p>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                {/* Remote User */}
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {user?.role === 'alumni'
                      ? call.studentId.fullName
                      : call.alumniId.fullName}
                  </span>
                </div>

                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {formatDateTime(call.scheduledStartTime)}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {Math.round(
                      (new Date(call.scheduledEndTime).getTime() -
                        new Date(call.scheduledStartTime).getTime()) /
                        60000
                    )}{' '}
                    minutes
                  </span>
                </div>

                {/* Description */}
                {call.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {call.description}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
                {isUpcoming(call.scheduledStartTime) && call.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleJoinCall(call)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                    >
                      <Video size={16} />
                      Join
                    </button>
                    {user?.role === 'alumni' && (
                      <button
                        onClick={() => handleDeleteCall(call._id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
                {!isUpcoming(call.scheduledStartTime) && call.status === 'scheduled' && (
                  <p className="text-sm text-gray-500 text-center w-full">
                    Call time has passed
                  </p>
                )}
                {call.status !== 'scheduled' && (
                  <p className="text-sm text-gray-500 text-center w-full capitalize">
                    {call.status}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
