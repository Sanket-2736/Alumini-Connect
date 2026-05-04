'use client';

import { useState } from 'react';
import axios from 'axios';

interface ProfileImageUploadProps {
  currentImage?: string;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export default function ProfileImageUpload({
  currentImage,
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!file) return null;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setPreviewImage(null);
      onUploadError?.(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      const response = await axios.post('/api/user/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentComplete = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentComplete);
        },
      });

      if (response.data.success) {
        setSuccess(true);
        setPreviewImage(null);
        onUploadSuccess?.(response.data.data.profilePicture);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Failed to upload profile picture';
      setError(errorMsg);
      setPreviewImage(null);
      onUploadError?.(errorMsg);
      console.error('Profile image upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      {/* Image Preview */}
      <div className="relative inline-block">
        <img
          src={previewImage || currentImage || '/default-avatar.svg'}
          alt="Profile"
          className={`w-32 h-32 rounded-full object-cover border-4 transition-all ${
            previewImage ? 'border-blue-300' : 'border-indigo-100'
          }`}
        />

        {/* Upload Button Overlay */}
        <label
          className={`absolute bottom-0 right-0 p-2 rounded-full text-white transition-all cursor-pointer shadow-lg ${
            disabled || isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </label>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Profile picture updated successfully!</span>
          </p>
        </div>
      )}

      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">Uploading profile picture...</p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
      </p>
    </div>
  );
}
