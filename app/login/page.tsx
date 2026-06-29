'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useAuthStore } from '@/lib/authStore';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/auth/login', formData);

      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        setAuth(user, accessToken);
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Professional Image & Benefits */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 items-center justify-center p-12 overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/image.png"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
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
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold">Welcome Back</h2>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Connect with thousands of alumni, access exclusive opportunities, and grow your professional network.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Verified Network</p>
                  <p className="text-sm text-indigo-200">Connect only with verified alumni and students</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Exclusive Opportunities</p>
                  <p className="text-sm text-indigo-200">Access jobs, mentorship, and career growth</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <CheckCircle size={24} className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Professional Community</p>
                  <p className="text-sm text-indigo-200">Build lasting professional relationships</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-indigo-400 mt-8">
              <p className="text-sm text-indigo-200">
                Trusted by alumni from leading universities
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Professional Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <div className="mb-6 lg:hidden">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-indigo-600">Alumni Connect</h1>
                <p className="text-sm text-gray-600 mt-1">Professional Network Platform</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Join now
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Secure Login</p>
              <p className="text-xs mt-1">We never share your data with third parties</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-600 space-y-2">
              <span className="block">By signing in, you agree to our Terms of Service</span>
              <span className="block">
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700">
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
