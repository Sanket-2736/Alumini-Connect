'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { UserRole } from '@/lib/enums';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  university: string;
  department: string;
  batch: string;
  role: UserRole;
  documents: File[];
}

interface University {
  _id: string;
  name: string;
  location: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    department: '',
    batch: '',
    role: UserRole.STUDENT,
    documents: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get('/api/universities');
        if (response.data.success) {
          setUniversities(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch universities:', error);
        setErrors(prev => ({ ...prev, universities: 'Failed to load universities' }));
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.university) newErrors.university = 'University is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.batch.trim()) newErrors.batch = 'Batch is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    // Validate documents
    if (formData.documents.length === 0) {
      setErrors({ documents: 'At least one verification document is required' });
      setStep(3);
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('university', formData.university);
      formDataToSend.append('department', formData.department);
      formDataToSend.append('batch', formData.batch);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('userType', formData.role === UserRole.STUDENT ? 'student' : 'alumni');

      // Add documents
      formData.documents.forEach((doc) => {
        formDataToSend.append('documents', doc);
      });

      const response = await axios.post('/api/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert('Registration successful! Your documents are pending admin verification. You will be able to sign in once approved.');
        router.push('/login');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step {step} of 3
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                  University
                </label>
                <select
                  id="university"
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleInputChange}
                  disabled={loadingUniversities}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingUniversities ? 'Loading universities...' : 'Select University'}
                  </option>
                  {universities.map((uni) => (
                    <option key={uni._id} value={uni._id}>
                      {uni.name} ({uni.location})
                    </option>
                  ))}
                </select>
                {errors.university && <p className="mt-1 text-sm text-red-600">{errors.university}</p>}
                {errors.universities && <p className="mt-1 text-sm text-red-600">{errors.universities}</p>}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
              </div>

              <div>
                <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
                  Batch/Year
                </label>
                <input
                  id="batch"
                  name="batch"
                  type="text"
                  required
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.batch && <p className="mt-1 text-sm text-red-600">{errors.batch}</p>}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.ALUMNI}>Alumni</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Verification Documents
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload your degree certificate, ID card, or other verification documents (PDF, JPG, PNG). Max 5MB per file.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setFormData(prev => ({ ...prev, documents: files }));
                      if (errors.documents) {
                        setErrors(prev => ({ ...prev, documents: '' }));
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="documents" className="cursor-pointer">
                    <p className="text-gray-600">
                      {formData.documents.length > 0
                        ? `${formData.documents.length} file(s) selected`
                        : 'Click to select files or drag and drop'}
                    </p>
                  </label>
                </div>
                {errors.documents && <p className="mt-1 text-sm text-red-600">{errors.documents}</p>}

                {formData.documents.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                    <ul className="space-y-2">
                      {formData.documents.map((doc, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                documents: prev.documents.filter((_, i) => i !== index),
                              }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || formData.documents.length === 0}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </div>
          )}

          {errors.submit && (
            <p className="text-sm text-red-600 text-center">{errors.submit}</p>
          )}
        </form>
      </div>
    </div>
  );
}