'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { VerificationStatus } from '@/lib/enums';

interface University {
  _id: string;
  name: string;
  slug: string;
}

interface Department {
  _id: string;
  name: string;
}

interface AlumniUser {
  _id: string;
  fullName: string;
  profilePicture?: string;
  university: University;
  department: string;
  batch: string;
  workDetails?: {
    company: string;
    jobTitle: string;
  };
  skills: string[];
  verificationStatus: VerificationStatus;
  connectionStatus: string;
}

interface SearchResponse {
  users: AlumniUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    university: '',
    department: '',
    batch: '',
    company: '',
    skills: [] as string[],
    onlyVerified: false,
  });
  const [results, setResults] = useState<AlumniUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Load universities
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const response = await fetch('/api/universities');
        if (response.ok) {
          const data = await response.json();
          setUniversities(data.universities || []);
        }
      } catch (error) {
        console.error('Failed to load universities:', error);
      }
    };
    loadUniversities();
  }, []);

  // Load departments when university is selected
  useEffect(() => {
    if (!filters.university) {
      setDepartments([]);
      return;
    }

    const loadDepartments = async () => {
      try {
        const response = await fetch(`/api/universities/${filters.university}`);
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    };
    loadDepartments();
  }, [filters.university]);

  const searchAlumni = useCallback(async (searchPage = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: searchPage.toString(),
        limit: '12',
        ...(filters.university && { university: filters.university }),
        ...(filters.department && { department: filters.department }),
        ...(filters.batch && { batch: filters.batch }),
        ...(filters.company && { company: filters.company }),
        ...(filters.skills.length > 0 && { skills: filters.skills.join(',') }),
        ...(filters.onlyVerified && { onlyVerified: 'true' }),
      });

      const response = await fetch(`/api/search/alumni?${params}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        if (append) {
          setResults(prev => [...prev, ...data.users]);
        } else {
          setResults(data.users);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      searchAlumni(1, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, searchAlumni]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      searchAlumni(nextPage, true);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (response.ok) {
        // Refresh search results
        searchAlumni(page, false);
      }
    } catch (error) {
      console.error('Connection request failed:', error);
    }
  };

  const getConnectionButton = (alumni: AlumniUser) => {
    switch (alumni.connectionStatus) {
      case 'connected':
        return (
          <Link
            href={`/dashboard/profile/${alumni._id}`}
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
            Pending
          </button>
        );
      case 'pending_received':
        return (
          <Link
            href="/dashboard/connections"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Respond
          </Link>
        );
      default:
        return (
          <button
            onClick={() => handleConnect(alumni._id)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Connect
          </button>
        );
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Alumni</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <select
                value={filters.university}
                onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value, department: '' }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Universities</option>
                {universities.map(uni => (
                  <option key={uni._id} value={uni.slug}>{uni.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!filters.university}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Year</label>
              <input
                type="text"
                placeholder="e.g., 2020"
                value={filters.batch}
                onChange={(e) => setFilters(prev => ({ ...prev, batch: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                placeholder="Company name"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <input
              id="only-verified"
              type="checkbox"
              checked={filters.onlyVerified}
              onChange={(e) => setFilters(prev => ({ ...prev, onlyVerified: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="only-verified" className="ml-2 text-sm text-gray-700">
              Only show verified alumni
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {results.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alumni found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((alumni) => (
            <div key={alumni._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img
                  src={alumni.profilePicture || '/default-avatar.png'}
                  alt={alumni.fullName}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{alumni.fullName}</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{alumni.university.name}</span>
                    {alumni.verificationStatus === VerificationStatus.APPROVED && (
                      <svg className="ml-1 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Batch:</span> {alumni.batch}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {alumni.department}
                </p>
                {alumni.workDetails && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Works at:</span> {alumni.workDetails.company} as {alumni.workDetails.jobTitle}
                  </p>
                )}
              </div>

              {alumni.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {alumni.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {alumni.skills.length > 3 && (
                      <span className="text-xs text-gray-500">+{alumni.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {getConnectionButton(alumni)}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}