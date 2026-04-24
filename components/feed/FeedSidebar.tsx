'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FeedSidebar() {
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [spotlight, setSpotlight] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, spotlightRes] = await Promise.all([
          fetch('/api/feed/trending-tags'),
          fetch('/api/user/spotlight')
        ]);

        if (tagsRes.ok) setTrendingTags(await tagsRes.json());
        if (spotlightRes.ok) setSpotlight(await spotlightRes.json());
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Trending Tags */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">🔥 Trending Tags</h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.slice(0, 8).map((tag) => (
            <Link
              key={tag._id}
              href={`/feed?search=${tag._id}`}
              className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm hover:bg-indigo-100"
            >
              #{tag._id} <span className="ml-1 text-xs">({tag.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Alumni Spotlight */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">⭐ Alumni Spotlight</h3>
        <div className="space-y-4">
          {spotlight.slice(0, 3).map((user) => (
            <div key={user._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={user.profilePicture || '/default-avatar.png'}
                alt={user.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm truncate">{user.fullName}</p>
                  {user.verificationStatus === 'approved' && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{user.currentRole}</p>
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">📅 Upcoming Events</h3>
        <div className="text-gray-500 text-sm text-center py-8">
          Check back soon for alumni events and webinars
        </div>
      </div>
    </div>
  );
}