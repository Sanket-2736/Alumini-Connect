'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, LogIn, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Lock className="text-white" size={32} />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            You need to be logged in to access this page.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <Clock className="text-orange-600" size={20} />
            <p className="text-sm font-medium text-orange-800">
              Redirecting in{' '}
              <span className="font-bold text-orange-600">{countdown}</span>s
            </p>
          </div>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-3 mb-8"
        >
          <Link
            href="/login"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <LogIn className="group-hover:translate-x-1 transition-transform" size={20} />
            Sign In Now
          </Link>

          <Link
            href="/register"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-200 group"
          >
            <UserPlus className="group-hover:scale-110 transition-transform" size={20} />
            Create Account
          </Link>
        </motion.div>

        {/* Features Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 mb-4">What You Can Access</h3>
          <ul className="space-y-3">
            {[
              'Connect with verified alumni',
              'Browse job opportunities',
              'Get mentorship guidance',
              'Join professional community',
            ].map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                {feature}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Back to Home */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          Go back to{' '}
          <Link href="/" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            Home
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
