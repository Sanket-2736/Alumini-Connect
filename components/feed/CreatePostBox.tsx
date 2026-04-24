'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/lib/authStore';

interface CreatePostBoxProps {
  onPostCreated: (post: any) => void;
}

export default function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [type, setType] = useState<'post' | 'success_story' | 'announcement'>('post');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImages(prev => [...prev.slice(0, 4), ...Array.from(files)].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;

    setPosting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);
      tags.forEach(tag => formData.append('tags', tag));
      images.forEach(img => formData.append('images', img));

      const response = await fetch('/api/feed/posts', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onPostCreated(data.post);
        setContent('');
        setImages([]);
        setTags([]);
        setType('post');
        setIsExpanded(false);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {!isExpanded ? (
        // Collapsed state
        <div className="flex items-center gap-3">
          <img
            src={user?.profilePicture || '/default-avatar.png'}
            alt={user?.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors text-left"
          >
            Share something with alumni…
          </button>
        </div>
      ) : (
        // Expanded state
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt={user?.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{user?.fullName}</p>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="text-sm text-gray-600 border-none bg-transparent cursor-pointer"
                >
                  <option value="post">Regular Post</option>
                  <option value="success_story">Success Story</option>
                  <option value="announcement">Announcement (Admin Only)</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={4}
          />

          {/* Character Counter */}
          <div className="text-sm text-gray-500">
            {content.length}/2000
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${index}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-32 hover:bg-gray-50"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Image Upload Zone */}
          {images.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">Drag and drop images or click to browse</p>
              <p className="text-sm text-gray-500">Max 5 images</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tags..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && images.length === 0) || posting}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}