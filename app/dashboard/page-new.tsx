'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import {
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  User,
  Plus,
} from 'lucide-react';

interface DashboardStats {
  connections: number;
  upcomingEvents: number;
  mentorRequests: number;
  jobRecommendations: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    upcomingEvents: 0,
    mentorRequests: 0,
    jobRecommendations: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setStats({
        connections: 142,
        upcomingEvents: 5,
        mentorRequests: 3,
        jobRecommendations: 12,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    {
      label: 'Connections',
      value: stats.connections,
      icon: Users,
      color: 'blue',
      href: '/dashboard/connections',
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'teal',
      href: '/dashboard/events',
    },
    {
      label: 'Mentor Requests',
      value: stats.mentorRequests,
      icon: MessageSquare,
      color: 'amber',
      href: '#',
    },
    {
      label: 'Job Recommendations',
      value: stats.jobRecommendations,
      icon: Briefcase,
      color: 'rose',
      href: '#',
    },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    teal: 'bg-teal-100 text-teal-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-slate-900">Welcome back, {user?.fullName}</h1>
        <p className="text-slate-600">Here's what's happening in your network today.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const bgColor = colorMap[card.color as keyof typeof colorMap];
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${bgColor}`}>
                  <Icon size={24} />
                </div>
                <TrendingUp size={20} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900">{isLoading ? '—' : card.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              View all <ArrowRight size={16} />
            </a>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Sarah Johnson connected with you</p>
                  <p className="text-sm text-slate-600">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-8"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={20} />
              Send Message
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              <Users size={20} />
              Find Connections
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              <Calendar size={20} />
              View Events
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 border-2 border-slate-300 text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              <Briefcase size={20} />
              Browse Jobs
            </button>
          </div>
        </motion.div>
      </div>

      {/* Featured Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl p-8 text-white"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Upgrade Your Profile</h2>
          <p className="text-blue-100 mb-6">
            Complete your profile to get discovered by more professionals and unlock exclusive features.
          </p>
          <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
            Complete Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
