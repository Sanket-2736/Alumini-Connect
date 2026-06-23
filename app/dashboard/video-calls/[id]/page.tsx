'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import VideoRoom from '@/components/video/VideoRoom';
import { toast } from 'sonner';

export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('sessionId');
  const role = searchParams.get('role') as 'initiator' | 'participant';
  const remoteName = searchParams.get('remoteName');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`/api/video-calls/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setBooking(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load call details');
        router.push('/dashboard/video-calls');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, router]);

  const handleCallEnd = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `/api/video-calls/${params.id}`,
        {
          status: 'completed',
          actualEndTime: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Call ended');
      router.push('/dashboard/video-calls');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-white">Loading call...</p>
      </div>
    );
  }

  if (!booking || !sessionId || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-white">Invalid call session</p>
      </div>
    );
  }

  return (
    <VideoRoom
      sessionId={sessionId}
      role={role}
      displayName={booking.alumniId._id === localStorage.getItem('userId') ? booking.alumniId.fullName : booking.studentId.fullName}
      remoteDisplayName={remoteName || 'Participant'}
      startTime={booking.scheduledStartTime}
      endTime={booking.scheduledEndTime}
      signalingUrl={process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:4000'}
      onCallEnd={handleCallEnd}
    />
  );
}
