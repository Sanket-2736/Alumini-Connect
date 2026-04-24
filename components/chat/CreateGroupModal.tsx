'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation } from '@/types/chat';

interface SearchUser {
  _id: string;
  fullName: string;
  profilePicture?: string;
  department?: string;
  batch?: string;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (conversation: Conversation) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [step, setStep] = useState<'info' | 'members'>('info');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<'custom' | 'batch' | 'department'>('custom');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search/alumni?q=${encodeURIComponent(q)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const users: SearchUser[] = (data.data?.users || data.users || []);
          setSearchResults(users.filter((u) => !selectedMembers.some((m) => m._id === u._id)));
        }
      } finally { setSearching(false); }
    }, 300);
  };

  const toggleMember = (user: SearchUser) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m._id === user._id)
        ? prev.filter((m) => m._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required'); return; }
    setCreating(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('groupType', groupType);
      formData.append('memberIds', JSON.stringify(selectedMembers.map((m) => m._id)));
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch('/api/chat/groups', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) { setError(data.error || 'Failed to create group'); return; }

      onGroupCreated(data.conversation);
    } catch { setError('Failed to create group. Please try again.'); }
    finally { setCreating(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div
              className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Group avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {/* Group type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Group Type</label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="custom">Custom</option>
              <option value="batch">Batch</option>
              <option value="department">Department</option>
            </select>
          </div>

          {/* Member search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Add Members</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search alumni…"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => { toggleMember(u); setSearchQuery(''); setSearchResults([]); }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                  >
                    <img src={u.profilePicture || '/default-avatar.svg'} alt={u.fullName} className="w-7 h-7 rounded-full object-cover" />
                    <span className="flex-1 truncate">{u.fullName}</span>
                    <span className="text-xs text-gray-400">{u.batch}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMembers.map((m) => (
                  <span key={m._id} className="flex items-center space-x-1 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    <span>{m.fullName}</span>
                    <button onClick={() => toggleMember(m)} className="text-indigo-500 hover:text-indigo-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
          <span className="text-xs text-gray-500">{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</span>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
