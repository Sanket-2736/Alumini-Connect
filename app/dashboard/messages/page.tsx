'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useChatStore } from '@/lib/chatStore';
import { useNotificationStore } from '@/lib/notificationStore';
import { io, Socket } from 'socket.io-client';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import NewMessageModal from '@/components/chat/NewMessageModal';
import CreateGroupModal from '@/components/chat/CreateGroupModal';
import { Conversation, Message, Attachment, Reaction, AppNotification } from '@/types/chat';

const MESSAGES_PER_PAGE = 30;

export default function MessagesPage() {
  const { user, accessToken } = useAuthStore();
  const {
    conversations, activeConversationId, messages, messageCursors, hasMoreMessages,
    typingUsers, onlineUsers,
    setConversations, addConversation, updateConversation, setActiveConversationId,
    setMessages, prependMessages, addMessage, updateMessage, removeMessage,
    setCursor, setHasMore, setTyping, setOnline, resetUnread,
  } = useChatStore();
  const { prependNotification, incrementUnread, addToast } = useNotificationStore();

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const socketRef = useRef<Socket | null>(null);
  const loadedConvsRef = useRef<Set<string>>(new Set());

  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;
  const activeMessages = activeConversationId ? messages.get(activeConversationId) || [] : [];
  const activeTypingUsers = activeConversationId ? typingUsers.get(activeConversationId) || [] : [];
  const activeHasMore = activeConversationId ? hasMoreMessages.get(activeConversationId) ?? false : false;

  // ─── Socket Setup ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !accessToken) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => console.log('✅ Socket connected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
    socket.on('error', (err: { code: string; message: string }) => console.error('Socket error:', err));

    socket.on('message:new', (message: Message) => {
      const convId = message.conversationId.toString();
      addMessage(message);
      updateConversation(convId, {
        lastMessage: { _id: message._id, content: message.content, sender: message.sender, createdAt: message.createdAt, attachments: message.attachments } as any,
        lastActivity: message.createdAt,
        unreadCount: message.sender._id !== user._id
          ? (conversations.find((c) => c._id === convId)?.unreadCount || 0) + 1
          : undefined,
      } as any);
    });

    socket.on('message:seen', (data: { conversationId: string; seenBy: string; upToMessageId: string }) => {
      const msgs = messages.get(data.conversationId) || [];
      msgs.forEach((msg) => {
        if (msg.sender._id === user._id && msg._id <= data.upToMessageId && msg.status !== 'seen') {
          updateMessage(msg._id, data.conversationId, { status: 'seen' });
        }
      });
    });

    socket.on('message:deleted', (data: { messageId: string; conversationId: string }) => {
      removeMessage(data.messageId, data.conversationId);
    });

    socket.on('typing:update', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTyping(data.conversationId, data.userId, data.isTyping);
    });

    socket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen: Date }) => {
      setOnline(data.userId, data.isOnline);
    });

    socket.on('group:member_added', (data: { conversationId: string; addedUser: any }) => {
      // Reload conversations to get updated member count
      loadConversations();
    });

    socket.on('group:member_removed', (data: { conversationId: string; removedUserId: string }) => {
      if (data.removedUserId === user._id) {
        // We were removed — remove from list
        setConversations(conversations.filter((c) => c._id !== data.conversationId));
        if (activeConversationId === data.conversationId) {
          setActiveConversationId(null);
          setMobileView('list');
        }
      } else {
        loadConversations();
      }
    });

    socket.on('notification:new', (notification: AppNotification) => {
      prependNotification(notification);
      incrementUnread();
      addToast(notification);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, accessToken]);

  // ─── Load Conversations ─────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) { console.error('Failed to load conversations:', err); }
  }, [setConversations]);

  useEffect(() => {
    if (!user) return;
    setLoadingConversations(true);
    loadConversations().finally(() => setLoadingConversations(false));
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load Messages ──────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (conversationId: string, cursor?: string) => {
    const isPaginating = !!cursor;
    if (isPaginating) setLoadingMore(true);
    else setLoadingMessages(true);

    try {
      const url = new URL(`/api/chat/conversations/${conversationId}/messages`, window.location.origin);
      url.searchParams.set('limit', String(MESSAGES_PER_PAGE));
      if (cursor) url.searchParams.set('before', cursor);

      const res = await fetch(url.toString());
      if (!res.ok) return;

      const data = await res.json();
      const fetched: Message[] = data.messages || [];

      if (isPaginating) prependMessages(conversationId, fetched);
      else setMessages(conversationId, fetched);

      setCursor(conversationId, data.nextCursor || null);
      setHasMore(conversationId, data.hasMore ?? false);
    } catch (err) { console.error('Failed to load messages:', err); }
    finally { setLoadingMessages(false); setLoadingMore(false); }
  }, [prependMessages, setMessages, setCursor, setHasMore]);

  // ─── Select Conversation ────────────────────────────────────────────────────

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setActiveConversationId(conversation._id);
    setMobileView('chat');
    resetUnread(conversation._id);
    socketRef.current?.emit('conversation:open', { conversationId: conversation._id });

    if (!loadedConvsRef.current.has(conversation._id)) {
      loadedConvsRef.current.add(conversation._id);
      await loadMessages(conversation._id);
    }
  }, [setActiveConversationId, resetUnread, loadMessages]);

  const handleLoadMore = useCallback((conversationId: string) => {
    const cursor = messageCursors.get(conversationId);
    if (cursor) loadMessages(conversationId, cursor);
  }, [messageCursors, loadMessages]);

  const handleSendMessage = useCallback((conversationId: string, content: string, attachments: Attachment[], replyToId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', { conversationId, content: content || undefined, attachments, replyToId });
    } else {
      fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments, replyToId }),
      }).then((r) => r.json()).then((d) => { if (d.message) addMessage(d.message); }).catch(console.error);
    }
  }, [addMessage]);

  const handleMessageSeen = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit('message:seen', { conversationId, messageId });
  }, []);

  const handleTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, []);

  const handleTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, []);

  const handleMessageDeleted = useCallback((messageId: string, conversationId: string) => {
    removeMessage(messageId, conversationId);
  }, [removeMessage]);

  const handleReactionUpdate = useCallback((messageId: string, conversationId: string, reactions: Reaction[]) => {
    updateMessage(messageId, conversationId, { reactions });
  }, [updateMessage]);

  const handleConversationUpdate = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    updateConversation(conversationId, updates);
  }, [updateConversation]);

  const handleLeaveGroup = useCallback((conversationId: string) => {
    setConversations(conversations.filter((c) => c._id !== conversationId));
    setActiveConversationId(null);
    setMobileView('list');
  }, [conversations, setConversations, setActiveConversationId]);

  const handleConversationCreated = useCallback((conversation: Conversation) => {
    addConversation(conversation);
    handleConversationSelect(conversation);
    setShowNewMessageModal(false);
    setShowCreateGroupModal(false);
  }, [addConversation, handleConversationSelect]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50 overflow-hidden">
      {/* ── Conversation List ───────────────────────────────────────────────── */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>New DM</span>
            </button>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              title="Create group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onlineUsers={onlineUsers}
          onConversationSelect={handleConversationSelect}
          loading={loadingConversations}
        />
      </div>

      {/* ── Chat Window ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <ChatWindow
              conversation={activeConversation}
              messages={activeMessages}
              currentUserId={user._id}
              isOnline={activeConversation.type === 'dm' ? onlineUsers.has(activeConversation.otherParticipant?._id || '') : false}
              typingUserIds={activeTypingUsers}
              hasMore={activeHasMore}
              loadingMore={loadingMore}
              onSendMessage={handleSendMessage}
              onMessageSeen={handleMessageSeen}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              onLoadMore={handleLoadMore}
              onMessageDeleted={handleMessageDeleted}
              onReactionUpdate={handleReactionUpdate}
              onConversationUpdate={handleConversationUpdate}
              onLeaveGroup={handleLeaveGroup}
              onBack={() => setMobileView('list')}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Your Messages</h3>
              <p className="text-sm text-gray-500 mb-4">Select a conversation or start a new one</p>
              <div className="flex space-x-3 justify-center">
                <button onClick={() => setShowNewMessageModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  New Message
                </button>
                <button onClick={() => setShowCreateGroupModal(true)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewMessageModal && (
        <NewMessageModal onClose={() => setShowNewMessageModal(false)} onConversationCreated={handleConversationCreated} />
      )}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} onGroupCreated={handleConversationCreated} />
      )}
    </div>
  );
}
