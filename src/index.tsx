import { useState, useEffect } from 'react';
import App from './App';
import { UserFavorites } from './components/UserFavorites';
import { UserAlerts } from './components/UserAlerts';
import { UserRatings } from './components/UserRatings';
import { UserSettings } from './components/UserSettings';
import { AdminPanel } from './components/AdminPanel';

export default function Root() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for custom navigation events
    window.addEventListener('navigate', handleLocationChange as EventListener);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange as EventListener);
    };
  }, []);

  // Route matching
  switch (currentPath) {
    case '/favorites':
      return <UserFavorites />;
    case '/alerts':
      return <UserAlerts />;
    case '/ratings':
      return <UserRatings />;
    case '/settings':
      return <UserSettings />;
    case '/admin':
      return <AdminPanel />;
    default:
      return <App />;
  }
}