'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/lib/notificationStore';
import { AppNotification } from '@/types/chat';

function Toast({ notification, onDismiss }: { notification: AppNotification; onDismiss: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleView = () => {
    onDismiss();
    router.push(notification.link);
  };

  return (
    <div className="flex items-start space-x-3 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-80 animate-slide-in">
      {notification.actor ? (
        <img
          src={notification.actor.profilePicture || '/default-avatar.svg'}
          alt={notification.actor.fullName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <button
          onClick={handleView}
          className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          View →
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast._id} notification={toast} onDismiss={() => removeToast(toast._id)} />
      ))}
    </div>
  );
}
