import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Globe, Clock } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface AnalyticsDashboardProps {
  accessToken: string;
}

export function AnalyticsDashboard({ accessToken }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/analytics?days=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  // Prepare chart data
  const dailyChartData = analytics.daily.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pageviews: day.pageviews,
    visitors: day.uniqueVisitors,
  }));

  // Get top pages
  const allPages: Record<string, number> = {};
  analytics.daily.forEach((day: any) => {
    Object.entries(day.pages).forEach(([page, count]) => {
      if (!allPages[page]) allPages[page] = 0;
      allPages[page] += count as number;
    });
  });

  const topPages = Object.entries(allPages)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Get top referrers
  const allReferrers: Record<string, number> = {};
  analytics.daily.forEach((day: any) => {
    Object.entries(day.referrers).forEach(([referrer, count]) => {
      if (!allReferrers[referrer]) allReferrers[referrer] = 0;
      allReferrers[referrer] += count as number;
    });
  });

  const topReferrers = Object.entries(allReferrers)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // Calculate hourly average
  const hourlyAverage = Array(24).fill(0);
  analytics.daily.forEach((day: any) => {
    day.hourly.forEach((count: number, hour: number) => {
      hourlyAverage[hour] += count;
    });
  });

  const hourlyData = hourlyAverage.map((total, hour) => ({
    hour: hour.toString().padStart(2, '0') + ':00',
    views: Math.round(total / analytics.daily.length),
  }));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Traffic Analytics</h2>
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === days
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Page Views Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-gray-900">Page Views Over Time</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pageviews" stroke="#16a34a" strokeWidth={2} name="Page Views" />
            <Line type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2} name="Unique Visitors" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Traffic Pattern */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-600" />
          <h3 className="text-gray-900">Average Traffic by Hour</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="views" fill="#8b5cf6" name="Avg. Views" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Pages and Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-900">Top Pages</h3>
          </div>
          <div className="space-y-3">
            {topPages.length > 0 ? (
              topPages.map(({ page, count }, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm truncate">{page || '/'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / topPages[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-gray-600">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No page data yet</p>
            )}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="text-gray-900">Top Referrers</h3>
          </div>
          <div className="space-y-3">
            {topReferrers.length > 0 ? (
              topReferrers.map(({ referrer, count }, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm truncate">{referrer}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / topReferrers[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-gray-600">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No referrer data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Views</p>
          <p className="text-gray-900 text-xl mt-1">
            {analytics.daily.reduce((sum: number, day: any) => sum + day.pageviews, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Avg. Daily Views</p>
          <p className="text-gray-900 text-xl mt-1">
            {Math.round(
              analytics.daily.reduce((sum: number, day: any) => sum + day.pageviews, 0) / analytics.daily.length
            ).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Peak Day</p>
          <p className="text-gray-900 text-xl mt-1">
            {Math.max(...analytics.daily.map((day: any) => day.pageviews)).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Top Pages</p>
          <p className="text-gray-900 text-xl mt-1">{topPages.length}</p>
        </div>
      </div>
    </div>
  );
}
