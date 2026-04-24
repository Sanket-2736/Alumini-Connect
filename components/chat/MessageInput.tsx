'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Attachment, Message } from '@/types/chat';

interface MessageInputProps {
  onSendMessage: (content: string, attachments: Attachment[], replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥',
  '🎉','✅','❌','🙏','💪','🤝','👏','😮','🤣','😊','😇','🥳',
];

export default function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Focus textarea when reply changes
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

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

  // ESC cancels reply
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && replyTo) onCancelReply();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [replyTo, onCancelReply]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`; // max ~4 lines
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    resizeTextarea();

    // Typing indicator logic
    if (val && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (val) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop();
      }, 2000);
    } else {
      isTypingRef.current = false;
      onTypingStop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || disabled || uploading) return;

    onSendMessage(trimmed, attachments, replyTo?._id);
    setContent('');
    setAttachments([]);
    onCancelReply();

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }

    // Reset textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, attachments, disabled, uploading, replyTo, onSendMessage, onCancelReply, onTypingStop]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');
    setUploading(true);

    try {
      const results = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
          }
          return res.json() as Promise<Attachment>;
        })
      );
      setAttachments((prev) => [...prev, ...results]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = content.slice(0, start) + emoji + content.slice(end);
    setContent(newVal);
    setShowEmojiPicker(false);
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
      resizeTextarea();
    });
  };

  const canSend = (content.trim() || attachments.length > 0) && !disabled && !uploading;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-0.5 h-8 bg-indigo-400 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-indigo-700 truncate">
                Replying to {replyTo.sender.fullName}
              </p>
              <p className="text-xs text-indigo-500 truncate">
                {replyTo.content || '📎 Attachment'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 flex-shrink-0 text-indigo-400 hover:text-indigo-600 transition-colors"
            aria-label="Cancel reply"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="relative flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 max-w-[200px]"
            >
              {att.type === 'image' ? (
                <img src={att.url} alt={att.fileName} className="w-8 h-8 rounded object-cover flex-shrink-0" />
              ) : (
                <svg className="w-8 h-8 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{att.fileName}</p>
                <p className="text-xs text-gray-500">
                  {att.fileSize < 1024 * 1024
                    ? `${(att.fileSize / 1024).toFixed(1)} KB`
                    : `${(att.fileSize / 1024 / 1024).toFixed(1)} MB`}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(i)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Remove attachment"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="px-4 pt-2 text-xs text-red-500">{uploadError}</p>
      )}

      {/* Input row */}
      <div className="flex items-end space-x-2 px-4 py-3">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors rounded-full hover:bg-gray-100"
          title="Attach file"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={disabled}
            rows={1}
            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-relaxed"
            style={{ minHeight: '40px', maxHeight: '96px' }}
          />

          {/* Emoji button inside textarea */}
          <div className="absolute right-2 bottom-2" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              title="Emoji"
              aria-label="Insert emoji"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl p-3 shadow-xl z-30 w-64">
                <div className="grid grid-cols-8 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="w-7 h-7 hover:bg-gray-100 rounded-lg flex items-center justify-center text-base transition-colors"
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Send"
          aria-label="Send message"
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
