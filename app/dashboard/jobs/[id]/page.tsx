'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/lib/authStore';

type Job = {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  applicants: string[];
};

export default function JobPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`/api/jobs/${params.id}`);
        const data: Job = res.data;

        setJob(data);

        if (user) {
          // ✅ FIX: safe comparison (ObjectId vs string)
          const isApplied = data.applicants.some(
            (id) => id.toString() === user._id
          );
          setApplied(isApplied);
        }

      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id, user]);

  const handleApply = async () => {
    try {
      await axios.post(`/api/jobs/${params.id}/apply`);
      setApplied(true);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <h1>{job.title}</h1>
      <p>{job.description}</p>

      <h3>Skills</h3>
      <div>
        {job.skills.map((skill) => (
          <span key={skill}>{skill} </span>
        ))}
      </div>

      <button onClick={handleApply} disabled={applied}>
        {applied ? 'Already Applied' : 'Apply'}
      </button>
    </div>
  );
}