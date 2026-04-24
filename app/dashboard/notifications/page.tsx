'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/lib/notificationStore';
import { AppNotification } from '@/types/chat';

const TABS = [
  { key: '', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'message', label: 'Messages' },
  { key: 'connection_request,connection_accepted', label: 'Connections' },
  { key: 'job_posted', label: 'Jobs' },
];

function formatRelative(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, setNotifications, markRead, markAllRead, removeNotification, setUnreadCount } =
    useNotificationStore();
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(
    async (tab: string, pg: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(pg), limit: '20' });
        if (tab === 'unread') params.set('unreadOnly', 'true');
        else if (tab) params.set('type', tab);

        const res = await fetch(`/api/notifications?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setNotifications([...notifications, ...(data.notifications || [])]);
          } else {
            setNotifications(data.notifications || []);
          }
          setHasMore(data.pagination.page < data.pagination.pages);
        }
      } finally {
        setLoading(false);
      }
    },
    [notifications, setNotifications]
  );

  useEffect(() => {
    setPage(1);
    loadNotifications(activeTab, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleClickNotification = async (n: AppNotification) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n._id}/read`, { method: 'PUT' });
      markRead(n._id);
    }
    router.push(n.link);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    removeNotification(id);
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    markAllRead();
    setUnreadCount(0);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadNotifications(activeTab, next, true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClickNotification(n)}
              className={`flex items-start space-x-3 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group ${
                !n.isRead ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'bg-white border border-gray-100'
              }`}
            >
              {n.actor ? (
                <img
                  src={n.actor.profilePicture || '/default-avatar.svg'}
                  alt={n.actor.fullName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                <button
                  onClick={(e) => handleDelete(e, n._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                  aria-label="Delete notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
