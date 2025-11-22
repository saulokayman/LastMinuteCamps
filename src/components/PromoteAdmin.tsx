import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function PromoteAdmin() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const promoteUser = async () => {
    setStatus('loading');
    setMessage('Processing...');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/promote-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'dannerz@gmail.com' }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`✓ Success! ${data.message}\n\nUser ID: ${data.userId}\n\nPlease log out and log back in to see the Admin Panel option.`);
      } else {
        setStatus('error');
        setMessage(`✗ Error: ${data.error}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`✗ Network Error: ${error.message}\n\nPlease check your internet connection and try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white">CampFinder - Admin Promotion</h1>
              <p className="text-green-100">Promote user to admin role</p>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-gray-900 mb-4">Promote User to Admin</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900">
              <strong>User to promote:</strong> dannerz@gmail.com
            </p>
          </div>

          <button
            onClick={promoteUser}
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {status === 'loading' ? 'Processing...' : status === 'success' ? '✓ Promoted!' : 'Promote to Admin'}
          </button>

          {status !== 'idle' && (
            <div
              className={`p-4 rounded-lg ${
                status === 'loading'
                  ? 'bg-blue-50 border border-blue-200 text-blue-900'
                  : status === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{message}</pre>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-yellow-900 mb-2">Next Steps:</h3>
              <ol className="text-yellow-900 text-sm list-decimal list-inside space-y-1">
                <li>Log out of your account</li>
                <li>Log back in with dannerz@gmail.com</li>
                <li>Click on your user menu (top right)</li>
                <li>You should now see "Admin Panel" option with a shield icon</li>
              </ol>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-900 mb-3">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>Endpoint:</strong> https://{projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/promote-user</p>
            <p><strong>Status:</strong> {status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
