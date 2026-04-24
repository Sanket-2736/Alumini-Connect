'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import CreatePostBox from '@/components/feed/CreatePostBox';
import PostCard from '@/components/feed/PostCard';
import FeedSidebar from '@/components/feed/FeedSidebar';

interface Post {
  _id: string;
  author: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    university?: string;
    verificationStatus: string;
  };
  content: string;
  images: string[];
  type: string;
  tags: string[];
  likes: number;
  comments: number;
  shareCount: number;
  isPinned?: boolean;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'global' | 'university'>('global');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = async (pageNum: number = 1) => {
    try {
      const response = await fetch(
        `/api/feed?scope=${scope}&page=${pageNum}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
    setPage(1);
  }, [scope]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed - 65% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scope Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setScope('global')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  scope === 'global'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Global Feed
              </button>
              <button
                onClick={() => setScope('university')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  scope === 'university'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                My University
              </button>
            </div>

            {/* Create Post Box */}
            {user && (
              <CreatePostBox onPostCreated={handlePostCreated} />
            )}

            {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-500 text-lg">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                <>
                  {posts.map(post => (
                    <PostCard key={post._id} post={post} onUpdate={() => loadPosts(1)} />
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center pt-6">
                      <button
                        onClick={handleLoadMore}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - 35% */}
          <div className="hidden lg:block">
            <FeedSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}