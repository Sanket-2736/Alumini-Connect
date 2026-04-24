'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import Link from 'next/link';
import Image from 'next/image';

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [expanded, setExpanded] = useState(false);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/feed/posts/${post._id}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleShare = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/feed/${post._id}`;
    navigator.clipboard.writeText(url);
    alert('Post link copied to clipboard!');
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/feed/posts/${post._id}/save`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <img
            src={post.author.profilePicture || '/default-avatar.png'}
            alt={post.author.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{post.author.fullName}</p>
              {post.author.verificationStatus === 'approved' && (
                <span className="text-blue-500">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{post.author.university}</p>
            <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Type badge */}
        {post.type === 'announcement' && (
          <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
            📣 Announcement
          </span>
        )}
        {post.type === 'success_story' && (
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            🏆 Success Story
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={`text-gray-800 ${!expanded && post.content.length > 200 ? 'line-clamp-3' : ''}`}>
          {post.content}
        </p>
        {post.content.length > 200 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            See more
          </button>
        )}
      </div>

      {/* Images Grid */}
      {post.images.length > 0 && (
        <div className="mb-4 grid gap-1 grid-cols-2 md:grid-cols-3">
          {post.images.slice(0, 3).map((img: string, idx: number) => (
            <img key={idx} src={img} alt="Post" className="w-full h-32 object-cover rounded-lg" />
          ))}
          {post.images.length > 3 && (
            <div className="relative w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600">+{post.images.length - 3}</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between pt-4 border-t text-gray-600">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${
            isLiked ? 'text-red-600' : ''
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span className="text-sm">{likeCount}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
          <span>💬</span>
          <span className="text-sm">{post.comments}</span>
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
          <span>↗</span>
          <span className="text-sm">{post.shareCount}</span>
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 ${
            isSaved ? 'text-amber-500' : ''
          }`}
        >
          <span>{isSaved ? '🔖' : '🔲'}</span>
        </button>
      </div>
    </div>
  );
}