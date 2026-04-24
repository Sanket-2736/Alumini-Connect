'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Reaction } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar: boolean;
  currentUserId: string;
  isGroup?: boolean;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReactionUpdate: (messageId: string, reactions: Reaction[]) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

// Group reactions by emoji
function groupReactions(reactions: Reaction[]): { emoji: string; count: number; userIds: string[] }[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const existing = map.get(r.emoji) || [];
    map.set(r.emoji, [...existing, r.userId]);
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({ emoji, count: userIds.length, userIds }));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  showAvatar,
  currentUserId,
  isGroup = false,
  onReply,
  onDelete,
  onReactionUpdate,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  const handleReaction = async (emoji: string) => {
    setShowEmojiPicker(false);
    try {
      const res = await fetch(`/api/chat/messages/${message._id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        onReactionUpdate(message._id, data.reactions);
      }
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/messages/${message._id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(message._id);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const groupedReactions = groupReactions(message.reactions || []);

  // Deleted message
  if (message.isDeleted) {
    return (
      <div
        className={`flex items-end mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
        data-message-id={message._id}
      >
        {!isOwn && (
          <div className="w-8 flex-shrink-0 mr-2">
            {showAvatar && (
              <img
                src={message.sender.profilePicture || '/default-avatar.svg'}
                alt={message.sender.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
          </div>
        )}
        <span className="text-xs italic text-gray-400 px-3 py-2 bg-gray-100 rounded-2xl">
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Attachment"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div
        className={`flex items-end mb-0.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowDeleteConfirm(false); }}
        data-message-id={message._id}
      >
        {/* Avatar (other user only) */}
        <div className={`w-8 flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          {!isOwn && showAvatar && (
            <img
              src={message.sender.profilePicture || '/default-avatar.svg'}
              alt={message.sender.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>

        {/* Bubble + reactions */}
        <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Reply quote */}
          {message.replyTo && (
            <div
              className={`mb-1 px-3 py-1.5 rounded-lg border-l-4 text-xs max-w-full ${
                isOwn
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                  : 'border-gray-300 bg-gray-50 text-gray-700'
              }`}
            >
              <p className="font-medium truncate">{message.replyTo.sender?.fullName || 'Unknown'}</p>
              <p className="truncate opacity-75">{message.replyTo.content || '📎 Attachment'}</p>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`relative px-3 py-2 shadow-sm ${
              isOwn
                ? `bg-indigo-600 text-white ${
                    isFirstInGroup && isLastInGroup
                      ? 'rounded-2xl rounded-br-md'
                      : isFirstInGroup
                      ? 'rounded-2xl rounded-br-sm'
                      : isLastInGroup
                      ? 'rounded-2xl rounded-tr-sm rounded-br-md'
                      : 'rounded-2xl rounded-r-sm'
                  }`
                : `bg-white text-gray-900 border border-gray-200 ${
                    isFirstInGroup && isLastInGroup
                      ? 'rounded-2xl rounded-bl-md'
                      : isFirstInGroup
                      ? 'rounded-2xl rounded-bl-sm'
                      : isLastInGroup
                      ? 'rounded-2xl rounded-tl-sm rounded-bl-md'
                      : 'rounded-2xl rounded-l-sm'
                  }`
            }`}
          >
            {/* Image attachments */}
            {message.attachments?.filter((a) => a.type === 'image').map((att, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <img
                  src={att.url}
                  alt={att.fileName}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '240px', objectFit: 'cover' }}
                  onClick={() => setLightboxUrl(att.url)}
                />
              </div>
            ))}

            {/* Document attachments */}
            {message.attachments?.filter((a) => a.type === 'document').map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-2 p-2 rounded-lg mb-2 last:mb-0 ${
                  isOwn ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.fileName}</p>
                  <p className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {formatBytes(att.fileSize)}
                  </p>
                </div>
                <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}

            {/* Sender name in group chats */}
            {isGroup && !isOwn && isFirstInGroup && (
              <p className="text-xs font-semibold text-indigo-600 mb-1">{message.sender.fullName}</p>
            )}

            {/* Text content */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}

            {/* Timestamp + status */}
            <div
              className={`flex items-center justify-end space-x-1 mt-1 transition-opacity ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && (
                <span className="text-xs">
                  {message.status === 'sent' && <span className="text-indigo-300">✓</span>}
                  {message.status === 'delivered' && <span className="text-indigo-300">✓✓</span>}
                  {message.status === 'seen' && <span className="text-blue-300">✓✓</span>}
                </span>
              )}
            </div>
          </div>

          {/* Reactions */}
          {groupedReactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {groupedReactions.map(({ emoji, count, userIds }) => {
                const isMine = userIds.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      isMine
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isMine ? 'Remove reaction' : 'Add reaction'}
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span>{count}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover action buttons */}
        <div
          className={`flex items-center space-x-1 mx-2 transition-opacity ${
            hovered ? 'opacity-100' : 'opacity-0'
          } ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
        >
          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* Emoji reaction */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="React"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div
                className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl p-2 shadow-lg z-20 ${
                  isOwn ? 'right-0' : 'left-0'
                }`}
              >
                <div className="flex space-x-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delete (own messages only) */}
          {isOwn && (
            <div className="relative">
              <button
                onClick={() => setShowDeleteConfirm((v) => !v)}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              {showDeleteConfirm && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl p-3 shadow-lg z-20 w-44">
                  <p className="text-xs text-gray-700 mb-2">Delete this message?</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleting ? '…' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
