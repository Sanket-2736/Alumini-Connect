'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check credentials against environment variables
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@12345';

      if (email !== adminEmail || password !== adminPassword) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Create token by calling backend
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      const responseData = await response.json();
      console.log('📨 Login Response:', responseData);

      if (!responseData.data || !responseData.data.token) {
        setError('Invalid login response - no token received');
        setIsLoading(false);
        return;
      }

      const token = responseData.data.token;

      // Store token and credentials
      localStorage.setItem('accessToken', token);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('adminEmail', adminEmail);

      // Debug: Log token creation
      console.log('✅ Admin login successful');
      console.log('📝 Token stored:', token.substring(0, 20) + '...');
      console.log('💾 LocalStorage contents:', {
        accessToken: localStorage.getItem('accessToken')?.substring(0, 20) + '...',
        userRole: localStorage.getItem('userRole'),
        adminEmail: localStorage.getItem('adminEmail'),
      });

      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Demo Credentials:</strong><br />
            Email: {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com'}<br />
            Password: {process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@12345'}
          </p>
        </div>
      </div>
    </div>
  );
}
