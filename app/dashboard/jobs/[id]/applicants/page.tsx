'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Applicant {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  currentRole?: string;
  university?: string;
  appliedAt: string;
}

export default function ApplicantsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/applicants`);
      if (response.ok) {
        const data = await response.json();
        setApplicants(data.applicants);
      }
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/dashboard/jobs/my-posts" className="text-indigo-600 hover:text-indigo-700">
            ← Back to My Posts
          </Link>
          <h1 className="text-4xl font-bold mt-2">Job Applicants</h1>
          <p className="text-gray-600 mt-2">{applicants.length} applicants</p>
        </div>

        {applicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No applicants yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map(applicant => (
              <div key={applicant._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={applicant.profilePicture || '/default-avatar.png'}
                      alt={applicant.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{applicant.fullName}</h3>
                      <p className="text-gray-600">{applicant.currentRole}</p>
                      <p className="text-sm text-gray-500">{applicant.university}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${applicant.email}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Email
                    </a>
                    <Link
                      href={`/profile/${applicant._id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
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