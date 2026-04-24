'use client';

interface TypingIndicatorProps {
  /** Names or user IDs of people currently typing */
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-2 py-1">
      {/* Animated dots */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-2xl px-3 py-2">
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-gray-500">typing…</span>
    </div>
  );
}
