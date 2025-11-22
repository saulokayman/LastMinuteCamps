import { useState, useEffect } from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function AdminPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('admin_access_token');
    const storedAdmin = localStorage.getItem('admin_user');
    
    if (token && storedAdmin) {
      setAccessToken(token);
      setAdmin(JSON.parse(storedAdmin));
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, adminData: any) => {
    setAccessToken(token);
    setAdmin(adminData);
    localStorage.setItem('admin_access_token', token);
    localStorage.setItem('admin_user', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setAccessToken(null);
    setAdmin(null);
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!accessToken || !admin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminDashboard
      accessToken={accessToken}
      admin={admin}
      onLogout={handleLogout}
    />
  );
}
