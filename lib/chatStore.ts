'use client';

import { create } from 'zustand';
import { Conversation, Message } from '@/types/chat';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Messages per conversation
  messages: Map<string, Message[]>;

  // Cursor for pagination per conversation (oldest message _id)
  messageCursors: Map<string, string | null>;

  // Whether there are more messages to load per conversation
  hasMoreMessages: Map<string, boolean>;

  // Typing users per conversation
  typingUsers: Map<string, string[]>;

  // Online users set
  onlineUsers: Set<string>;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setActiveConversationId: (id: string | null) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, conversationId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string, conversationId: string) => void;

  setCursor: (conversationId: string, cursor: string | null) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, isOnline: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;

  decrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: new Map(),
  messageCursors: new Map(),
  hasMoreMessages: new Map(),
  typingUsers: new Map(),
  onlineUsers: new Set(),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c._id !== conversation._id)],
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, ...updates } : c
      ),
    })),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => {
      const newMap = new Map(state.messages);
      newMap.set(conversationId, messages);
      return { messages: newMap };
    }),

  prependMessages: (conversationId, newMessages) =>
    set((state) => {
      const existing = state.messages.get(conversationId) || [];
      const newMap = new Map(state.messages);
      newMap.set(conversationId, [...newMessages, ...existing]);
      return { messages: newMap };
    }),

  addMessage: (message) =>
    set((state) => {
      const convId = message.conversationId;
      const existing = state.messages.get(convId) || [];
      // Avoid duplicates
      if (existing.some((m) => m._id === message._id)) return state;
      const newMap = new Map(state.messages);
      newMap.set(convId, [...existing, message]);
      return { messages: newMap };
    }),

  updateMessage: (messageId, conversationId, updates) =>
    set((state) => {
      const existing = state.messages.get(conversationId) || [];
      const newMap = new Map(state.messages);
      newMap.set(
        conversationId,
        existing.map((m) => (m._id === messageId ? { ...m, ...updates } : m))
      );
      return { messages: newMap };
    }),

  removeMessage: (messageId, conversationId) =>
    set((state) => {
      const existing = state.messages.get(conversationId) || [];
      const newMap = new Map(state.messages);
      newMap.set(
        conversationId,
        existing.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: undefined, attachments: [] }
            : m
        )
      );
      return { messages: newMap };
    }),

  setCursor: (conversationId, cursor) =>
    set((state) => {
      const newMap = new Map(state.messageCursors);
      newMap.set(conversationId, cursor);
      return { messageCursors: newMap };
    }),

  setHasMore: (conversationId, hasMore) =>
    set((state) => {
      const newMap = new Map(state.hasMoreMessages);
      newMap.set(conversationId, hasMore);
      return { hasMoreMessages: newMap };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers.get(conversationId) || [];
      const newMap = new Map(state.typingUsers);
      if (isTyping) {
        if (!current.includes(userId)) {
          newMap.set(conversationId, [...current, userId]);
        }
      } else {
        newMap.set(conversationId, current.filter((id) => id !== userId));
      }
      return { typingUsers: newMap };
    }),

  setOnline: (userId, isOnline) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return { onlineUsers: newSet };
    }),

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),

  decrementUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 0) - 1) }
          : c
      ),
    })),

  resetUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),
}));
