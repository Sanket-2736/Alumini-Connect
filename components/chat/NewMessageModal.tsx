'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation } from '@/types/chat';

interface SearchUser {
  _id: string;
  fullName: string;
  profilePicture?: string;
  department?: string;
  batch?: string;
}

interface NewMessageModalProps {
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export default function NewMessageModal({ onClose, onConversationCreated }: NewMessageModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/alumni?q=${encodeURIComponent(value)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.alumni || data.users || []);
        }
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectUser = async (user: SearchUser) => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: user._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start conversation');
        return;
      }

      onConversationCreated(data.conversation);
    } catch {
      setError('Failed to start conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search connected alumni…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {loading && (
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 && query && !loading ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">
              No connected alumni found for &ldquo;{query}&rdquo;
            </div>
          ) : results.length === 0 && !query ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Search for a connected alumni to start a conversation
            </div>
          ) : (
            results.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user)}
                disabled={creating}
                className="w-full flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user.profilePicture || '/default-avatar.svg'}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                  {(user.department || user.batch) && (
                    <p className="text-xs text-gray-500 truncate">
                      {[user.department, user.batch].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                {creating && (
                  <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
