'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { UserRole } from '@/lib/enums';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Upload, ArrowRight, ArrowLeft, Info } from 'lucide-react';

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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
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
    if (!formData.batch.trim()) newErrors.batch = 'Batch/Year is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleContinue = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.documents.length === 0) {
      setErrors({ documents: 'At least one verification document is required' });
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
      formData.documents.forEach((doc) => {
        formDataToSend.append('documents', doc);
      });
      const response = await axios.post('/api/auth/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        toast.success('Registration successful! Your documents are pending admin verification.');
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

  const getRoleDescription = (role: UserRole) => {
    if (role === UserRole.ALUMNI) {
      return 'Access alumni-exclusive features, mentoring tools, and career opportunities';
    }
    return 'Connect with peers, access campus resources, and prepare for your career';
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 items-center justify-center p-12 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-15">
          <img src="/image copy 2.png" alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 text-center text-white max-w-md space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="text-7xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
              AC
            </div>
            <p className="text-sm text-indigo-200 mt-2">Alumni Connect</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-4xl font-bold mb-3">Join Our Community</h2>
              <p className="text-indigo-100 text-lg leading-relaxed">
                Connect with peers and mentors. Access exclusive opportunities and build relationships that last a lifetime.
              </p>
            </div>
            <div className="space-y-4 pt-6">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Verified Members</p>
                  <p className="text-sm text-indigo-200">Only verified alumni and students</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Role-Based Features</p>
                  <p className="text-sm text-indigo-200">Tailored experience for students and alumni</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Secure Platform</p>
                  <p className="text-sm text-indigo-200">Enterprise-grade security for your data</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="mb-6 lg:hidden text-center">
              <h1 className="text-3xl font-bold text-indigo-600">Alumni Connect</h1>
              <p className="text-sm text-gray-600 mt-1">Professional Network Platform</p>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  {errors.fullName && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min. 8 characters"
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <p className="mt-2 text-xs text-gray-600">Must contain: uppercase, lowercase, and numbers</p>
                  {errors.password && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
                <div>
                  <label htmlFor="university" className="block text-sm font-semibold text-gray-900">University</label>
                  <select
                    id="university"
                    name="university"
                    required
                    value={formData.university}
                    onChange={handleInputChange}
                    disabled={loadingUniversities}
                    className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
                  >
                    <option value="">{loadingUniversities ? 'Loading universities...' : 'Select Your University'}</option>
                    {universities.map((uni) => (
                      <option key={uni._id} value={uni._id}>{uni.name} ({uni.location})</option>
                    ))}
                  </select>
                  {errors.university && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.university}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-semibold text-gray-900">Department</label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science"
                      className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    {errors.department && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.department}</p>}
                  </div>
                  <div>
                    <label htmlFor="batch" className="block text-sm font-semibold text-gray-900">Batch/Year</label>
                    <input
                      id="batch"
                      name="batch"
                      type="text"
                      required
                      value={formData.batch}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024"
                      className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    {errors.batch && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.batch}</p>}
                  </div>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Account Type</label>
                  <div className="space-y-3">
                    {[UserRole.STUDENT, UserRole.ALUMNI].map((roleOption) => (
                      <label
                        key={roleOption}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                          formData.role === roleOption
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={roleOption}
                          checked={formData.role === roleOption}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{roleOption}</p>
                          <p className="text-xs text-gray-600 mt-1">{getRoleDescription(roleOption)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                  <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">Verification Required</p>
                    <p className="text-xs mt-1">Upload documents to verify your identity and affiliation</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Upload Verification Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer">
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
                      <div className="space-y-2">
                        <Upload size={32} className="mx-auto text-gray-400" />
                        <p className="text-gray-900 font-medium">
                          {formData.documents.length > 0
                            ? `${formData.documents.length} file(s) selected`
                            : 'Click to select or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-600">PDF, JPG, PNG • Max 5MB per file</p>
                      </div>
                    </label>
                  </div>
                  {errors.documents && <p className="mt-3 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={16} /> {errors.documents}</p>}

                  {formData.documents.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-sm font-semibold text-gray-900">Selected Files:</p>
                      <ul className="space-y-2">
                        {formData.documents.map((doc, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="text-sm text-gray-700">
                              <CheckCircle size={16} className="inline mr-2 text-green-600" />
                              {doc.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  documents: prev.documents.filter((_, i) => i !== index),
                                }));
                              }}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">⚠️ Important:</span> Your account will be reviewed within 24-48 hours. You'll receive an email once approved.
                  </p>
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || formData.documents.length === 0}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin">⏳</span> Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-600 space-y-2">
              <span className="block">By signing up, you agree to our Terms of Service</span>
              <span className="block">
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Privacy Policy
                </Link>
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
