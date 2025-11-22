import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AdminLoginProps {
  onLoginSuccess: (accessToken: string, admin: any) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError('No session returned');
        setLoading(false);
        return;
      }

      // Verify admin role
      const verifyResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
          },
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setError(errorData.error || 'Not authorized as admin');
        setLoading(false);
        return;
      }

      const verifyData = await verifyResponse.json();
      onLoginSuccess(data.session.access_token, verifyData.admin);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // After successful signup, automatically login
      await handleLogin(e);
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-gray-900 mb-2">
            {isSignup ? 'Create Admin Account' : 'Admin Login'}
          </h1>
          <p className="text-gray-600">CampFinder Administration</p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm mb-2">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="admin@campfinder.com"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="text-green-600 hover:text-green-700 text-sm"
          >
            {isSignup ? 'Already have an account? Sign in' : 'First time? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}
