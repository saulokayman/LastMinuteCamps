import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SnapshotStatusProps {
  accessToken: string;
}

interface ScheduledTime {
  hour: number;
  label: string;
  description: string;
  lastRun?: string;
  status?: 'success' | 'pending' | 'missed';
}

export function SnapshotStatus({ accessToken }: SnapshotStatusProps) {
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [scheduledTimes, setScheduledTimes] = useState<ScheduledTime[]>([
    { hour: 8, label: '8:00 AM', description: 'When sites release' },
    { hour: 12, label: '12:00 PM', description: 'Cancellations check' },
    { hour: 20, label: '8:00 PM', description: 'Late cancellations' },
  ]);

  useEffect(() => {
    checkSnapshots();
    // Check every minute
    const interval = setInterval(checkSnapshots, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkSnapshots = async () => {
    try {
      // Get snapshot history from the backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/snapshot-history`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSnapshotData(data);
        
        // Update scheduled times with status
        const now = new Date();
        const pacificOffset = -8; // PST is UTC-8
        const pacificHour = (now.getUTCHours() + pacificOffset + 24) % 24;
        
        const updatedSchedule = scheduledTimes.map(time => {
          const runData = data.todayRuns?.find((run: any) => run.hour === time.hour);
          
          if (runData) {
            return {
              ...time,
              lastRun: runData.timestamp,
              status: 'success' as const,
            };
          } else if (pacificHour > time.hour) {
            // Past the scheduled time but no run recorded
            return {
              ...time,
              status: 'missed' as const,
            };
          } else {
            return {
              ...time,
              status: 'pending' as const,
            };
          }
        });
        
        setScheduledTimes(updatedSchedule);
      }
    } catch (error) {
      console.error('Error checking snapshots:', error);
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
      
      if (response.ok) {
        alert('✅ Snapshot test successful!\n\n' + JSON.stringify(result.result || result, null, 2));
      } else {
        alert('❌ Snapshot test failed!\n\n' + JSON.stringify(result, null, 2));
      }
      
      await checkSnapshots();
    } catch (error) {
      alert('❌ Error testing cron: ' + error);
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

  const getOverallStatus = () => {
    if (!snapshotData) return { color: 'gray', text: 'Loading...', icon: Clock };
    
    const hasRecentSnapshot = snapshotData.lastSnapshot && 
      (Date.now() - new Date(snapshotData.lastSnapshot.timestamp).getTime()) < 12 * 60 * 60 * 1000;
    
    const hasTodayRuns = snapshotData.todayRuns && snapshotData.todayRuns.length > 0;
    
    if (hasRecentSnapshot || hasTodayRuns) {
      return { 
        color: 'green', 
        text: 'System Running', 
        icon: CheckCircle 
      };
    }
    
    // Check if any scheduled time was missed
    const missedRuns = scheduledTimes.filter(t => t.status === 'missed').length;
    if (missedRuns > 0) {
      return { 
        color: 'red', 
        text: 'Cron Jobs Not Configured', 
        icon: XCircle 
      };
    }
    
    return { 
      color: 'yellow', 
      text: 'Waiting for First Run', 
      icon: Clock 
    };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

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
          status.color === 'green' ? 'bg-green-100' :
          status.color === 'yellow' ? 'bg-yellow-100' :
          status.color === 'red' ? 'bg-red-100' :
          'bg-gray-100'
        }`}>
          <StatusIcon className={`w-6 h-6 ${
            status.color === 'green' ? 'text-green-600' :
            status.color === 'yellow' ? 'text-yellow-600' :
            status.color === 'red' ? 'text-red-600' :
            'text-gray-600'
          }`} />
        </div>

        <div className="flex-1">
          <h4 className="text-gray-900 mb-1">{status.text}</h4>
          
          {snapshotData?.lastSnapshot?.timestamp && (
            <p className="text-gray-600 text-sm">
              Last snapshot: {getTimeAgo(snapshotData.lastSnapshot.timestamp)}
            </p>
          )}
          
          {snapshotData?.newlyAvailableCount > 0 && (
            <p className="text-gray-600 text-sm">
              {snapshotData.newlyAvailableCount} newly available sites detected today
            </p>
          )}

          {snapshotData?.todayRuns && snapshotData.todayRuns.length > 0 && (
            <p className="text-green-600 text-sm">
              {snapshotData.todayRuns.length} snapshot{snapshotData.todayRuns.length > 1 ? 's' : ''} completed today
            </p>
          )}
        </div>
      </div>

      {/* Schedule Info with Status */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Scheduled Times (Pacific)
        </h4>
        <div className="space-y-2">
          {scheduledTimes.map((time, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{time.label}</span>
                {time.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                {time.status === 'missed' && (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                {time.status === 'pending' && (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  time.status === 'success' ? 'bg-green-100 text-green-700' :
                  time.status === 'missed' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {time.status === 'success' ? (time.lastRun ? `Ran ${getTimeAgo(time.lastRun)}` : 'Success') :
                   time.status === 'missed' ? 'Missed' :
                   time.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Required - Only show if cron is not working */}
      {status.color === 'red' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <strong>Action Required:</strong> Automatic snapshots not configured
          </p>
          <p className="text-red-700 text-xs mb-3">
            Go to the "Cron Setup" tab for detailed instructions on setting up automated snapshots.
          </p>
        </div>
      )}

      {/* Waiting message - Only show if pending first run */}
      {status.color === 'yellow' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Waiting for scheduled runs. You can test the system manually using the "Test Now" button above.
          </p>
        </div>
      )}
    </div>
  );
}
