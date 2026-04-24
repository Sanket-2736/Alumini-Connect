'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/lib/authStore';
import { VerificationStatus } from '@/lib/enums';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  university: any;
  department: string;
  batch: string;
  profilePicture?: string;
  bio?: string;
  workDetails?: {
    company: string;
    jobTitle: string;
    experienceYears: number;
  };
  skills: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  verificationStatus: VerificationStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    workDetails: {
      company: '',
      jobTitle: '',
      experienceYears: 0,
    },
    skills: [] as string[],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
    },
    batch: '',
    department: '',
  });

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [accessToken, router]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/user/me');
      if (response.data.success) {
        setProfile(response.data.data);
        setEditForm({
          fullName: response.data.data.fullName,
          bio: response.data.data.bio || '',
          workDetails: response.data.data.workDetails || {
            company: '',
            jobTitle: '',
            experienceYears: 0,
          },
          skills: response.data.data.skills || [],
          socialLinks: response.data.data.socialLinks || {
            linkedin: '',
            github: '',
            twitter: '',
          },
          batch: response.data.data.batch,
          department: response.data.data.department,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      clearAuth();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put('/api/user/me', editForm);
      if (response.data.success) {
        setProfile(prev => prev ? { ...prev, ...editForm } : null);
        setIsEditing(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/api/user/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setProfile(prev => prev ? { ...prev, profilePicture: response.data.data.profilePicture } : null);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !editForm.skills.includes(skill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const getVerificationBadgeColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div>Failed to load profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="text-center">
              <div className="relative">
                <img
                  src={profile.profilePicture || '/default-avatar.svg'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </label>
                )}
              </div>
              <div className="mt-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationBadgeColor(profile.verificationStatus)}`}>
                  {profile.verificationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profile.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.department}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.batch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, batch: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.batch}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-gray-900">{profile.bio || 'No bio added yet'}</p>
              )}
            </div>

            {/* Work Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Details</label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Company"
                    value={editForm.workDetails.company}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      workDetails: { ...prev.workDetails, company: e.target.value }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={editForm.workDetails.jobTitle}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      workDetails: { ...prev.workDetails, jobTitle: e.target.value }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Years of Experience"
                    value={editForm.workDetails.experienceYears}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      workDetails: { ...prev.workDetails, experienceYears: parseInt(e.target.value) || 0 }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                profile.workDetails ? (
                  <div>
                    <p className="text-gray-900">{profile.workDetails.jobTitle} at {profile.workDetails.company}</p>
                    <p className="text-sm text-gray-600">{profile.workDetails.experienceYears} years of experience</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No work details added</p>
                )
              )}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editForm.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                        {skill}
                        <button
                          onClick={() => handleSkillRemove(skill)}
                          className="ml-1 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a skill"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSkillAdd((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills added</p>
                  )}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={editForm.socialLinks.linkedin}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="url"
                    placeholder="GitHub URL"
                    value={editForm.socialLinks.github}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="url"
                    placeholder="Twitter URL"
                    value={editForm.socialLinks.twitter}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {profile.socialLinks?.linkedin && (
                    <p className="text-gray-900">LinkedIn: <a href={profile.socialLinks.linkedin} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{profile.socialLinks.linkedin}</a></p>
                  )}
                  {profile.socialLinks?.github && (
                    <p className="text-gray-900">GitHub: <a href={profile.socialLinks.github} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{profile.socialLinks.github}</a></p>
                  )}
                  {profile.socialLinks?.twitter && (
                    <p className="text-gray-900">Twitter: <a href={profile.socialLinks.twitter} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{profile.socialLinks.twitter}</a></p>
                  )}
                  {!profile.socialLinks?.linkedin && !profile.socialLinks?.github && !profile.socialLinks?.twitter && (
                    <p className="text-gray-500">No social links added</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}