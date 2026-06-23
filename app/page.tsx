'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  MessageSquare,
  User,
  Newspaper,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      router.push('/dashboard');
    }
  }, [accessToken, user, router]);

  return (
    <div className="min-h-screen bg-white">
      {}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Alumni Connect Platform
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto"
            >
              Connect with your alumni network, build your professional profile, and discover new opportunities in your career journey.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center text-gray-900 mb-16"
        >
          Why Join Alumni Connect?
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Build Connections</h3>
            <p className="text-gray-600">
              Connect with alumni from your university, discover people in your field, and expand your professional network effortlessly.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <Briefcase size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Career Opportunities</h3>
            <p className="text-gray-600">
              Discover job postings, internships, and referral opportunities shared by alumni in your network.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Direct Messaging</h3>
            <p className="text-gray-600">
              Chat directly with connections, share insights, and collaborate on projects in real-time.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <User size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Professional Profile</h3>
            <p className="text-gray-600">
              Showcase your skills, experience, and achievements to stand out in your alumni community.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <Newspaper size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Alumni Feed</h3>
            <p className="text-gray-600">
              Stay updated with success stories, announcements, and insights shared by your alumni network.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-indigo-600 mb-4">
              <Shield size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Verified Community</h3>
            <p className="text-gray-600">
              Join a trusted community of verified alumni from your university with secure authentication.
            </p>
          </motion.div>
        </div>
      </div>

      {}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-16"
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Sign Up', desc: 'Create your account with your university email and verify your identity.' },
              { num: 2, title: 'Build Profile', desc: 'Add your skills, experience, and professional details to your profile.' },
              { num: 3, title: 'Connect', desc: 'Discover and connect with alumni from your university and beyond.' },
              { num: 4, title: 'Grow', desc: 'Collaborate, share opportunities, and grow your career with your network.' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                >
                  {step.num}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { value: '10K+', label: 'Active Alumni' },
            { value: '500+', label: 'Universities' },
            { value: '1000+', label: 'Job Opportunities' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-5xl font-bold text-indigo-600 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: idx * 0.1 + 0.3 }}
                viewport={{ once: true }}
              >
                {stat.value}
              </motion.div>
              <p className="text-xl text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {}
      <div className="bg-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6"
          >
            Ready to Connect with Your Alumni Network?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-indigo-100 mb-8"
          >
            Join thousands of alumni already building meaningful professional relationships.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              Get Started Today
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </div>

      {}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">About</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Forums</a></li>
                <li><a href="#" className="hover:text-white transition">Events</a></li>
                <li><a href="#" className="hover:text-white transition">Mentorship</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2026 Alumni Connect Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
