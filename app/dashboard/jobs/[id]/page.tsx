'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setApplied(data.applicants.includes(user?._id));
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, { method: 'POST' });
      if (response.ok) {
        setApplied(true);
        alert('Applied successfully!');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  const handleShare = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    alert('Job link copied!');
  };

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;
  if (!job) return <div className="text-center py-12">Job not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{job.title}</h1>
              <p className="text-xl text-gray-600">{job.company}</p>
            </div>
            {job.isReferral && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                🤝 Referral Opportunity
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {job.type.replace('_', ' ')}
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded">
              {job.experienceLevel}
            </span>
            {job.isRemote && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                📍 Remote
              </span>
            )}
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded">
              {job.location}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApply}
              disabled={applied}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                applied
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {applied ? '✓ Applied' : 'Apply Now'}
            </button>
            <button
              onClick={handleShare}
              className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Share
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <span key={skill} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Posted By */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Posted By</h3>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={job.postedBy.profilePicture || '/default-avatar.png'}
                  alt={job.postedBy.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{job.postedBy.fullName}</p>
                  <p className="text-sm text-gray-500">HR Manager</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Connect
              </button>
            </div>

            {/* Salary */}
            {job.salary?.min && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-lg mb-2">Salary</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                </p>
              </div>
            )}

            {/* Deadline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-2">Apply by</h3>
              <p className="text-gray-600">
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-600 mb-2">{job.viewCount} views</p>
              <p className="text-gray-600">{job.applicants.length} applicants</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}