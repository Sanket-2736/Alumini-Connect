'use client';

import { Conversation } from '@/types/chat';
import GroupAvatar from './GroupAvatar';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onlineUsers: Set<string>;
  onConversationSelect: (conversation: Conversation) => void;
  loading: boolean;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(text: string | undefined, max = 40): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onlineUsers,
  onConversationSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm text-gray-500">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">Start a new message or create a group</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const isActive = activeConversationId === conv._id;
        const isGroup = conv.type === 'group';
        const isOnline = !isGroup && conv.otherParticipant ? onlineUsers.has(conv.otherParticipant._id) : false;
        const lastMsgTime = conv.lastMessage?.createdAt || conv.lastActivity;
        const isOwnLastMsg = conv.lastMessage && !isGroup && conv.lastMessage.sender._id !== conv.otherParticipant?._id;

        const displayName = isGroup ? (conv.name || 'Group') : (conv.otherParticipant?.fullName || '');
        const subtitle = isGroup
          ? `${conv.memberCount || 0} members`
          : conv.lastMessage
          ? (isOwnLastMsg ? `You: ${truncate(conv.lastMessage.content)}` : truncate(conv.lastMessage.content)) ||
            (conv.lastMessage.attachments?.length ? '📎 Attachment' : '')
          : 'No messages yet';

        return (
          <button
            key={conv._id}
            onClick={() => onConversationSelect(conv)}
            className={`w-full flex items-center space-x-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
              isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {isGroup ? (
                <GroupAvatar name={displayName} avatarUrl={conv.groupAvatar} size="md" className="w-12 h-12 text-sm" />
              ) : (
                <>
                  <img
                    src={conv.otherParticipant?.profilePicture || '/default-avatar.svg'}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                  {displayName}
                </span>
                <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                  {lastMsgTime && (
                    <span className="text-xs text-gray-400">{formatRelativeTime(lastMsgTime)}</span>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-xs mt-0.5 truncate ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
