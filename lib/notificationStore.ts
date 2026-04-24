'use client';

import { create } from 'zustand';
import { AppNotification } from '@/types/chat';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: AppNotification[]; // transient toast queue

  setNotifications: (notifications: AppNotification[]) => void;
  prependNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  addToast: (notification: AppNotification) => void;
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],

  setNotifications: (notifications) => set({ notifications }),

  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications.filter((n) => n._id !== notification._id)],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n._id === id && !n.isRead) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  addToast: (notification) =>
    set((state) => ({ toasts: [...state.toasts, notification] })),

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t._id !== id) })),
}));
