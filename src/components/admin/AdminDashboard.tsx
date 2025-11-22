import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Eye, 
  TrendingUp, 
  Users, 
  Activity,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AdConfiguration } from './AdConfiguration';
import { SnapshotStatus } from './SnapshotStatus';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

interface AdminDashboardProps {
  accessToken: string;
  admin: any;
  onLogout: () => void;
}

export function AdminDashboard({ accessToken, admin, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ads'>('analytics');
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/analytics?days=7`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOverallStats(data.overall);
      }
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">CampFinder Admin</h1>
              <p className="text-gray-600 text-sm">Welcome back, {admin.name}</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {overallStats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm">Total Page Views</h3>
              <p className="text-gray-900 text-2xl mt-1">
                {overallStats.totalPageviews?.toLocaleString() || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm">Total Sessions</h3>
              <p className="text-gray-900 text-2xl mt-1">
                {overallStats.totalSessions?.toLocaleString() || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm">Tracking Since</h3>
              <p className="text-gray-900 text-2xl mt-1">
                {overallStats.startDate || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Snapshot Status Widget */}
        <div className="mb-6">
          <SnapshotStatus accessToken={accessToken} />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-6 py-4 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('ads')}
                className={`flex items-center gap-2 px-6 py-4 transition-colors ${
                  activeTab === 'ads'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Ad Management</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'analytics' && (
              <AnalyticsDashboard accessToken={accessToken} />
            )}

            {activeTab === 'ads' && (
              <AdConfiguration accessToken={accessToken} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}