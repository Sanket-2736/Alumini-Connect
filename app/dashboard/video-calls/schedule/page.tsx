'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

export default function ScheduleVideoCallPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get('/api/connections/my?status=accepted&role=student', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const studentList = response.data.data.connections
            .map((conn: any) => conn.user)
            .filter((user: any) => user.role === 'student');
          setStudents(studentList);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load connected students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !formData.title || !formData.scheduledStartTime || !formData.scheduledEndTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        '/api/video-calls',
        {
          studentId: selectedStudent,
          scheduledStartTime: formData.scheduledStartTime,
          scheduledEndTime: formData.scheduledEndTime,
          title: formData.title,
          description: formData.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('Video call scheduled successfully!');
        router.push('/dashboard/video-calls');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule call');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Video Call</h1>
        <p className="text-gray-600 mb-8">Set up a one-on-one video call with a student</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User size={16} className="text-indigo-600" />
                Select Student *
              </div>
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Choose a connected student...</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.fullName} ({student.email})
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                No connected students found. Please connect with students first.
              </p>
            )}
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Call Title *
              </div>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Career Mentoring Session"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any details about the call..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                Start Date & Time *
              </div>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledStartTime}
              onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                End Date & Time *
              </div>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledEndTime}
              onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 pt-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || students.length === 0}
              className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
