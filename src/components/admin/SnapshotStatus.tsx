import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SnapshotStatusProps {
  accessToken: string;
}

export function SnapshotStatus({ accessToken }: SnapshotStatusProps) {
  const [lastSnapshot, setLastSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkLastSnapshot();
    // Check every minute
    const interval = setInterval(checkLastSnapshot, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkLastSnapshot = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/newly-available`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Get the most recent timestamp
          const mostRecent = data.reduce((latest: any, current: any) => {
            const latestTime = new Date(latest.becameAvailableAt).getTime();
            const currentTime = new Date(current.becameAvailableAt).getTime();
            return currentTime > latestTime ? current : latest;
          });
          
          setLastSnapshot({
            timestamp: mostRecent.becameAvailableAt,
            count: data.length,
            status: 'success',
          });
        } else {
          setLastSnapshot({
            timestamp: null,
            count: 0,
            status: 'no_data',
          });
        }
      }
    } catch (error) {
      console.error('Error checking snapshot status:', error);
      setLastSnapshot({
        timestamp: null,
        count: 0,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testCron = async () => {
    setTesting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      alert(JSON.stringify(result, null, 2));
      await checkLastSnapshot();
    } catch (error) {
      alert('Error testing cron: ' + error);
    } finally {
      setTesting(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = () => {
    if (!lastSnapshot) return 'gray';
    if (lastSnapshot.status === 'success') {
      // Check if snapshot is recent (within 12 hours)
      if (lastSnapshot.timestamp) {
        const age = Date.now() - new Date(lastSnapshot.timestamp).getTime();
        if (age < 12 * 60 * 60 * 1000) return 'green';
        if (age < 24 * 60 * 60 * 1000) return 'yellow';
      }
      return 'yellow';
    }
    return 'red';
  };

  const statusColor = getStatusColor();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Snapshot Status
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Automatic Snapshots
        </h3>
        <button
          onClick={testCron}
          disabled={testing}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          Test Now
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-lg ${
          statusColor === 'green' ? 'bg-green-100' :
          statusColor === 'yellow' ? 'bg-yellow-100' :
          statusColor === 'red' ? 'bg-red-100' :
          'bg-gray-100'
        }`}>
          {statusColor === 'green' && <CheckCircle className="w-6 h-6 text-green-600" />}
          {statusColor === 'yellow' && <Clock className="w-6 h-6 text-yellow-600" />}
          {statusColor === 'red' && <XCircle className="w-6 h-6 text-red-600" />}
          {statusColor === 'gray' && <Clock className="w-6 h-6 text-gray-600" />}
        </div>

        <div className="flex-1">
          <h4 className="text-gray-900 mb-1">
            {statusColor === 'green' && 'System Running'}
            {statusColor === 'yellow' && 'Waiting for Next Snapshot'}
            {statusColor === 'red' && 'No Recent Snapshots'}
            {statusColor === 'gray' && 'Status Unknown'}
          </h4>
          
          {lastSnapshot?.timestamp && (
            <p className="text-gray-600 text-sm">
              Last snapshot: {getTimeAgo(lastSnapshot.timestamp)}
            </p>
          )}
          
          {lastSnapshot?.count > 0 && (
            <p className="text-gray-600 text-sm">
              {lastSnapshot.count} newly available sites detected today
            </p>
          )}
        </div>
      </div>

      {/* Schedule Info */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Scheduled Times (Pacific)
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Morning (8:00 AM)</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              When sites release
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Midday (12:00 PM)</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              Cancellations check
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Evening (8:00 PM)</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
              Late cancellations
            </span>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      {statusColor === 'red' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm mb-2">
            <strong>Action Required:</strong> Automatic snapshots not configured
          </p>
          <p className="text-red-700 text-xs mb-3">
            Set up scheduled functions to run snapshots automatically.
          </p>
          <div className="space-y-2 text-xs text-red-700">
            <p><strong>Option 1 - Netlify Scheduled Functions (Recommended if on Netlify):</strong></p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Deploy to Netlify (requires Pro plan $19/mo)</li>
              <li>Set environment variables: SUPABASE_PROJECT_ID, CRON_SECRET</li>
              <li>Functions auto-run on schedule</li>
            </ol>
            <p className="mt-2"><strong>Option 2 - cron-job.org (Free):</strong></p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Sign up at cron-job.org</li>
              <li>Create 3 jobs pointing to your snapshot endpoint</li>
              <li>Add X-Cron-Secret header</li>
            </ol>
            <p className="mt-2">See <strong>NETLIFY_CRON_SETUP.md</strong> or <strong>CRON_SETUP.md</strong> for full instructions.</p>
          </div>
        </div>
      )}

      {statusColor === 'yellow' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Last snapshot is over 12 hours old. Next scheduled run should happen soon.
          </p>
        </div>
      )}
    </div>
  );
}