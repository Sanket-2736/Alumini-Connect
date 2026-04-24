'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  type: string;
  experienceLevel: string;
  skills: string[];
  postedBy: { fullName: string; profilePicture?: string };
  isReferral: boolean;
  deadline: string;
  viewCount: number;
  applicants: number;
  createdAt: string;
}

export default function JobListingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: [] as string[],
    experienceLevel: '',
    isRemote: false,
    isReferral: false,
    skills: [] as string[],
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      params.append('type', filters.type.join(','));
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.isRemote) params.append('isRemote', 'true');
      if (filters.isReferral) params.append('isReferral', 'true');
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Job Opportunities</h1>
          <Link
            href="/dashboard/jobs/new"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Post a Job
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h3 className="font-bold text-lg mb-4">Filters</h3>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search jobs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Job Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              {['full_time', 'part_time', 'internship', 'contract', 'freelance'].map(type => (
                <label key={type} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.type.includes(type)}
                    onChange={() => toggleType(type)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                </label>
              ))}
            </div>

            {/* Experience Level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
              {['entry', 'mid', 'senior'].map(level => (
                <label key={level} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="radio"
                    name="experience"
                    checked={filters.experienceLevel === level}
                    onChange={() => setFilters(prev => ({ ...prev, experienceLevel: level }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600 capitalize">{level}</span>
                </label>
              ))}
            </div>

            {/* Remote */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isRemote}
                onChange={(e) => setFilters(prev => ({ ...prev, isRemote: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Remote only</span>
            </label>

            {/* Referral */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isReferral}
                onChange={(e) => setFilters(prev => ({ ...prev, isReferral: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Referral positions</span>
            </label>
          </div>

          {/* Job Cards */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </div>
            ) : (
              jobs.map(job => (
                <Link key={job._id} href={`/dashboard/jobs/${job._id}`}>
                  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                      {job.isReferral && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          🤝 Referral
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.type && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {job.type.replace('_', ' ')}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {job.experienceLevel}
                        </span>
                      )}
                      {job.isRemote && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          📍 Remote
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{job.location}</p>

                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.skills.slice(0, 4).map(skill => (
                          <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{job.applicants} applied</span>
                      <span>{job.viewCount} views</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}