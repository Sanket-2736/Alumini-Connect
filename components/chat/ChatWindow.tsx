'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, Attachment, Reaction } from '@/types/chat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import GroupAvatar from './GroupAvatar';
import GroupSettingsPanel from './GroupSettingsPanel';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  isOnline: boolean;
  typingUserIds: string[];
  hasMore: boolean;
  loadingMore: boolean;
  onSendMessage: (conversationId: string, content: string, attachments: Attachment[], replyToId?: string) => void;
  onMessageSeen: (conversationId: string, messageId: string) => void;
  onTypingStart: (conversationId: string) => void;
  onTypingStop: (conversationId: string) => void;
  onLoadMore: (conversationId: string) => void;
  onMessageDeleted: (messageId: string, conversationId: string) => void;
  onReactionUpdate: (messageId: string, conversationId: string, reactions: Reaction[]) => void;
  onConversationUpdate: (conversationId: string, updates: Partial<Conversation>) => void;
  onLeaveGroup: (conversationId: string) => void;
  onBack?: () => void;
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'short', day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function formatLastSeen(lastSeen: Date | string, isOnline: boolean): string {
  if (isOnline) return 'Online';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Last seen just now';
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Last seen ${diffH}h ago`;
  return `Last seen ${Math.floor(diffH / 24)}d ago`;
}

interface MessageGroup { date: string; messages: Message[] }

function groupByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let current: MessageGroup | null = null;
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (!current || current.date !== dateStr) {
      current = { date: dateStr, messages: [] };
      groups.push(current);
    }
    current.messages.push(msg);
  }
  return groups;
}

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  isOnline,
  typingUserIds,
  hasMore,
  loadingMore,
  onSendMessage,
  onMessageSeen,
  onTypingStart,
  onTypingStop,
  onLoadMore,
  onMessageDeleted,
  onReactionUpdate,
  onConversationUpdate,
  onLeaveGroup,
  onBack,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const isGroup = conversation.type === 'group';

  // Reset on conversation change
  useEffect(() => {
    isInitialLoadRef.current = true;
    seenMessageIdsRef.current = new Set();
    setReplyTo(null);
    setShowInfo(false);
  }, [conversation._id]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
    }
  }, [messages.length]);

  // Scroll to bottom on new message if near bottom
  const lastMessageId = messages[messages.length - 1]?._id;
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distFromBottom < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastMessageId]);

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !loadingMore) return;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [loadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loadingMore) return;
    if (prevScrollHeightRef.current > 0) {
      container.scrollTop += container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length, loadingMore]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 80 && hasMore && !loadingMore) {
      onLoadMore(conversation._id);
    }
  }, [hasMore, loadingMore, conversation._id, onLoadMore]);

  // Intersection observer for seen
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute('data-message-id');
            const senderId = entry.target.getAttribute('data-sender-id');
            if (msgId && senderId && senderId !== currentUserId && !seenMessageIdsRef.current.has(msgId)) {
              seenMessageIdsRef.current.add(msgId);
              onMessageSeen(conversation._id, msgId);
            }
          }
        }
      },
      { root: container, threshold: 0.5 }
    );
    container.querySelectorAll('[data-message-id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, conversation._id, currentUserId, onMessageSeen]);

  const messageGroups = groupByDate(messages);

  // Header content
  const headerAvatar = isGroup ? (
    <GroupAvatar name={conversation.name || 'Group'} avatarUrl={conversation.groupAvatar} size="md" />
  ) : (
    <div className="relative">
      <img
        src={conversation.otherParticipant?.profilePicture || '/default-avatar.svg'}
        alt={conversation.otherParticipant?.fullName}
        className="w-10 h-10 rounded-full object-cover"
      />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );

  const headerTitle = isGroup ? conversation.name : conversation.otherParticipant?.fullName;
  const headerSubtitle = isGroup
    ? `${conversation.memberCount || 0} members`
    : formatLastSeen(conversation.otherParticipant?.lastSeen || new Date(), isOnline);
  const headerSubtitleClass = isGroup ? 'text-gray-500' : isOnline ? 'text-green-600' : 'text-gray-500';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="mr-1 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors md:hidden" aria-label="Back">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {headerAvatar}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">{headerTitle}</h2>
            <p className={`text-xs ${headerSubtitleClass}`}>{headerSubtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo((v) => !v)}
          className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          aria-label="Info"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {loadingMore && (
            <div className="flex justify-center py-3">
              <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {!hasMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-gray-400">Beginning of conversation</span>
            </div>
          )}

          {messages.length === 0 && !loadingMore && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                {isGroup ? `Welcome to ${conversation.name}!` : `Say hi to ${conversation.otherParticipant?.fullName}!`}
              </p>
            </div>
          )}

          {messageGroups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateLabel(group.date)}
                </div>
              </div>

              {group.messages.map((message, index) => {
                // System messages
                if (message.isSystemMessage) {
                  return (
                    <div key={message._id} className="flex justify-center my-2">
                      <span className="text-xs italic text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  );
                }

                const prev = index > 0 ? group.messages[index - 1] : null;
                const next = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                const isFirstInGroup = !prev || prev.sender._id !== message.sender._id || prev.isSystemMessage;
                const isLastInGroup = !next || next.sender._id !== message.sender._id || next.isSystemMessage;

                return (
                  <div key={message._id} data-message-id={message._id} data-sender-id={message.sender._id}>
                    <MessageBubble
                      message={message}
                      isOwn={message.sender._id === currentUserId}
                      isFirstInGroup={isFirstInGroup ?? false}
                      isLastInGroup={isLastInGroup ?? false}
                      showAvatar={isFirstInGroup ?? false}
                      currentUserId={currentUserId}
                      isGroup={isGroup}
                      onReply={setReplyTo}
                      onDelete={(msgId) => onMessageDeleted(msgId, conversation._id)}
                      onReactionUpdate={(msgId, reactions) => onReactionUpdate(msgId, conversation._id, reactions)}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {typingUserIds.length > 0 && <TypingIndicator users={typingUserIds} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Right panel: DM info or Group settings */}
        {showInfo && (
          isGroup ? (
            <GroupSettingsPanel
              conversation={conversation}
              currentUserId={currentUserId}
              onClose={() => setShowInfo(false)}
              onGroupUpdated={(updates) => onConversationUpdate(conversation._id, updates)}
              onLeaveGroup={() => onLeaveGroup(conversation._id)}
            />
          ) : (
            <div className="hidden lg:flex w-72 border-l border-gray-200 bg-white flex-col flex-shrink-0">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Contact Info</h3>
              </div>
              <div className="p-5 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <img
                    src={conversation.otherParticipant?.profilePicture || '/default-avatar.svg'}
                    alt={conversation.otherParticipant?.fullName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <h4 className="text-base font-semibold text-gray-900">{conversation.otherParticipant?.fullName}</h4>
                <p className={`text-sm mt-1 ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {formatLastSeen(conversation.otherParticipant?.lastSeen || new Date(), isOnline)}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <MessageInput
        onSendMessage={(content, attachments, replyToId) => onSendMessage(conversation._id, content, attachments, replyToId)}
        onTypingStart={() => onTypingStart(conversation._id)}
        onTypingStop={() => onTypingStop(conversation._id)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={false}
      />
    </div>
  );
}
