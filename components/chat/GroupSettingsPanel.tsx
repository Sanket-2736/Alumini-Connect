'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation, GroupMember } from '@/types/chat';
import GroupAvatar from './GroupAvatar';

interface GroupSettingsPanelProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onGroupUpdated: (updates: Partial<Conversation>) => void;
  onLeaveGroup: () => void;
}

export default function GroupSettingsPanel({
  conversation,
  currentUserId,
  onClose,
  onGroupUpdated,
  onLeaveGroup,
}: GroupSettingsPanelProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(conversation.name || '');
  const [editDesc, setEditDesc] = useState(conversation.description || '');
  const [saving, setSaving] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<any[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isAdmin = conversation.admins?.includes(currentUserId);

  useEffect(() => {
    loadMembers();
    loadInvite();
  }, [conversation._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/chat/groups/${conversation._id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.group.members || []);
      }
    } finally { setLoadingMembers(false); }
  };

  const loadInvite = async () => {
    try {
      const res = await fetch(`/api/chat/groups/${conversation._id}/invite`);
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.inviteUrl || '');
      }
    } catch {}
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateInvite = async () => {
    const res = await fetch(`/api/chat/groups/${conversation._id}/invite`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setInviteUrl(data.inviteUrl || '');
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/chat/groups/${conversation._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        onGroupUpdated({ name: editName, description: editDesc });
        setEditMode(false);
      }
    } finally { setSaving(false); }
  };

  const handleSearchAdd = (q: string) => {
    setAddQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setAddResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setAddSearching(true);
      try {
        const res = await fetch(`/api/search/alumni?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          const users = data.data?.users || data.users || [];
          const memberIds = new Set(members.map((m) => m._id));
          setAddResults(users.filter((u: any) => !memberIds.has(u._id)));
        }
      } finally { setAddSearching(false); }
    }, 300);
  };

  const handleAddMember = async (userId: string) => {
    const res = await fetch(`/api/chat/groups/${conversation._id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] }),
    });
    if (res.ok) { setAddQuery(''); setAddResults([]); loadMembers(); }
  };

  const handleRemoveMember = async (userId: string) => {
    const res = await fetch(`/api/chat/groups/${conversation._id}/members/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      if (userId === currentUserId) { onLeaveGroup(); }
      else { loadMembers(); }
    }
    setOpenMenuId(null);
  };

  const handlePromote = async (userId: string) => {
    await fetch(`/api/chat/groups/${conversation._id}/members/${userId}/promote`, { method: 'PUT' });
    loadMembers();
    setOpenMenuId(null);
  };

  const handleDemote = async (userId: string) => {
    await fetch(`/api/chat/groups/${conversation._id}/members/${userId}/demote`, { method: 'PUT' });
    loadMembers();
    setOpenMenuId(null);
  };

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Group Info</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col items-center text-center mb-3">
            <GroupAvatar name={conversation.name || 'Group'} avatarUrl={conversation.groupAvatar} size="lg" className="mb-2 w-16 h-16 text-xl" />
            {editMode ? (
              <div className="w-full space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  placeholder="Description"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex space-x-2">
                  <button onClick={handleSaveInfo} disabled={saving} className="flex-1 text-xs bg-indigo-600 text-white py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="flex-1 text-xs bg-gray-100 text-gray-700 py-1 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-900">{conversation.name}</h4>
                {conversation.description && (
                  <p className="text-xs text-gray-500 mt-1">{conversation.description}</p>
                )}
                {isAdmin && (
                  <button onClick={() => setEditMode(true)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                    Edit info
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Invite link */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Invite Link</p>
          <div className="flex items-center space-x-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 truncate"
            />
            <button
              onClick={handleCopyInvite}
              className="text-xs px-2 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          {isAdmin && (
            <button onClick={handleRegenerateInvite} className="mt-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Regenerate link
            </button>
          )}
        </div>

        {/* Members */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">{members.length} Members</p>
          </div>

          {/* Add member search (admin only) */}
          {isAdmin && (
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={addQuery}
                  onChange={(e) => handleSearchAdd(e.target.value)}
                  placeholder="Add members…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              {addResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                  {addResults.map((u) => (
                    <button key={u._id} onClick={() => handleAddMember(u._id)} className="w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 text-left">
                      <img src={u.profilePicture || '/default-avatar.svg'} alt={u.fullName} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs truncate">{u.fullName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Member list */}
          {loadingMembers ? (
            <div className="flex justify-center py-4">
              <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <div key={member._id} className="flex items-center space-x-2 py-1.5 group">
                  <img src={member.profilePicture || '/default-avatar.svg'} alt={member.fullName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{member.fullName}</p>
                  </div>
                  {member.role === 'admin' && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Admin</span>
                  )}
                  {isAdmin && member._id !== currentUserId && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member._id ? null : member._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === member._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36 py-1">
                          {member.role === 'member' ? (
                            <button onClick={() => handlePromote(member._id)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                              Make admin
                            </button>
                          ) : (
                            <button onClick={() => handleDemote(member._id)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                              Remove admin
                            </button>
                          )}
                          <button onClick={() => handleRemoveMember(member._id)} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave group */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => handleRemoveMember(currentUserId)}
          className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Leave Group
        </button>
      </div>
    </div>
  );
}
