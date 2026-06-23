'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface University {
  _id: string;
  name: string;
  slug: string;
  location: string;
  state?: string;
  website?: string;
  yearEstablished?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalStudents?: number;
  totalAlumni?: number;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    state: '',
    website: '',
    yearEstablished: new Date().getFullYear(),
    description: '',
    contactEmail: '',
    contactPhone: '',
    totalStudents: 0,
    totalAlumni: 0,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/admin/universities', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUniversities(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');

      const data = new FormData();
      data.append('name', formData.name);
      data.append('location', formData.location);
      if (formData.state) data.append('state', formData.state);
      if (formData.website) data.append('website', formData.website);
      data.append('yearEstablished', String(formData.yearEstablished));
      if (formData.description) data.append('description', formData.description);
      if (formData.contactEmail) data.append('contactEmail', formData.contactEmail);
      if (formData.contactPhone) data.append('contactPhone', formData.contactPhone);
      data.append('totalStudents', String(formData.totalStudents));
      data.append('totalAlumni', String(formData.totalAlumni));
      if (logoFile) data.append('logo', logoFile);

      const response = await axios.post('/api/admin/universities', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUniversities([...universities, response.data.data]);
        setFormData({
          name: '',
          location: '',
          state: '',
          website: '',
          yearEstablished: new Date().getFullYear(),
          description: '',
          contactEmail: '',
          contactPhone: '',
          totalStudents: 0,
          totalAlumni: 0,
        });
        setLogoFile(null);
        setLogoPreview(null);
        setShowForm(false);
        toast.success('University added successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.patch(
        `/api/admin/universities/${id}`,
        { isActive: !isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUniversities(
          universities.map((uni) =>
            uni._id === id ? { ...uni, isActive: !isActive } : uni
          )
        );
        toast.success(`University ${isActive ? 'deactivated' : 'activated'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update university');
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `/api/admin/universities/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUniversities(universities.filter((uni) => uni._id !== id));
        toast.success('University deleted successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete university');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Add University'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New University</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  University Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., MIT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Cambridge, MA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Massachusetts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Year Established
                </label>
                <input
                  type="number"
                  value={formData.yearEstablished}
                  onChange={(e) => setFormData({ ...formData, yearEstablished: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 1861"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="admin@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+1-234-567-8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Students
                </label>
                <input
                  type="number"
                  value={formData.totalStudents}
                  onChange={(e) => setFormData({ ...formData, totalStudents: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Alumni
                </label>
                <input
                  type="number"
                  value={formData.totalAlumni}
                  onChange={(e) => setFormData({ ...formData, totalAlumni: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                University Logo
              </label>
              <div className="mt-1 flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded border border-gray-200 bg-gray-50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center">
                    No logo
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setLogoFile(file);
                      if (file) {
                        setLogoPreview(URL.createObjectURL(file));
                      } else {
                        setLogoPreview(null);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP or SVG · max 2MB</p>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description about the university..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add University'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {universities.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No universities found. Add one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {universities.map((uni) => (
              <div
                key={uni._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white flex items-center gap-3">
                  {uni.logoUrl ? (
                    <img
                      src={uni.logoUrl}
                      alt={`${uni.name} logo`}
                      className="w-10 h-10 object-contain rounded bg-white p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                      {uni.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{uni.name}</h3>
                    <p className="text-blue-100 text-sm">Founded: {uni.yearEstablished || 'N/A'}</p>
                  </div>
                </div>

                {}
                <div className="px-6 py-4">
                  <div className="space-y-3 mb-4">
                    {}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Location:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {uni.location}
                        {uni.state && `, ${uni.state}`}
                      </p>
                    </div>

                    {}
                    {(uni.totalStudents || uni.totalAlumni) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        {(uni.totalStudents ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Students</p>
                            <p className="text-sm font-semibold text-gray-900">{(uni.totalStudents ?? 0).toLocaleString()}</p>
                          </div>
                        )}
                        {(uni.totalAlumni ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Alumni</p>
                            <p className="text-sm font-semibold text-gray-900">{(uni.totalAlumni ?? 0).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {}
                    {uni.description && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 line-clamp-2">{uni.description}</p>
                      </div>
                    )}

                    {}
                    <div className="pt-2 border-t border-gray-200">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          uni.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {uni.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {}
                  {uni.website && (
                    <div className="mb-4 pb-4 border-t border-gray-200 pt-4">
                      <a
                        href={uni.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>

                {}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(uni._id, uni.isActive)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      uni.isActive
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {uni.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUniversity(uni._id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
