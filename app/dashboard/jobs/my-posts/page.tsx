'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobPost {
  _id: string;
  title: string;
  company: string;
  type: string;
  status: string;
  applicants: number;
  viewCount: number;
  deadline: string;
  createdAt: string;
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobPosts();
  }, []);

  const fetchJobPosts = async () => {
    try {
      const response = await fetch('/api/jobs/my-posts');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Failed to fetch job posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (jobId: string) => {
    if (!confirm('Close this job posting?')) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (response.ok) {
        setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'closed' } : j));
      }
    } catch (error) {
      console.error('Failed to close job:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Job Posts</h1>
          <Link
            href="/dashboard/jobs/new"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Post New Job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't posted any jobs yet</p>
            <Link
              href="/dashboard/jobs/new"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Job Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Applicants</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Views</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Deadline</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'closed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.applicants}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.viewCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        href={`/dashboard/jobs/${job._id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View
                      </Link>
                      {job.status === 'active' && (
                        <>
                          <Link
                            href={`/dashboard/jobs/${job._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleClose(job._id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Close
                          </button>
                        </>
                      )}
                      <Link
                        href={`/dashboard/jobs/${job._id}/applicants`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Applicants ({job.applicants})
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}