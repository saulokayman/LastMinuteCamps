import { useState, useEffect } from 'react'
import { Home, Heart, Settings, LogIn, LogOut, Menu, X, Shield } from 'lucide-react'
import { getSupabaseClient } from './utils/supabase/client.tsx'
import { AuthModal } from './components/AuthModal'
import { HomePage } from './components/HomePage'
import { FavoritesPage } from './components/FavoritesPage'
import { AdminPanel } from './components/AdminPanel'
import { AdminBootstrap } from './components/AdminBootstrap'
import { AdBanner } from './components/AdBanner'
import { projectId, publicAnonKey } from './utils/supabase/info.tsx'

type Page = 'home' | 'favorites' | 'admin' | 'bootstrap'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [user, setUser] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        setAccessToken(session.access_token)
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    if (!accessToken) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleAuthSuccess = (authUser: any) => {
    setUser(authUser)
    setShowAuthModal(false)
    // Reload to get fresh session
    window.location.reload()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setAccessToken(null)
    setCurrentPage('home')
  }

  const navigateTo = (page: Page) => {
    if ((page === 'favorites' || page === 'admin') && !user) {
      setShowAuthModal(true)
      return
    }

    if (page === 'admin' && !userProfile?.isAdmin) {
      alert('Admin access required')
      return
    }

    setCurrentPage(page)
    setShowMobileMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LastMinuteCamps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl">LastMinuteCamps</h1>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigateTo('home')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentPage === 'home'
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>

              <button
                onClick={() => navigateTo('favorites')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentPage === 'favorites'
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favorites
                {userProfile?.favorites?.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                    {userProfile.favorites.length}
                  </span>
                )}
              </button>

              {userProfile?.isAdmin && (
                <button
                  onClick={() => navigateTo('admin')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    currentPage === 'admin'
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => navigateTo('home')}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                  currentPage === 'home'
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-5 h-5" />
                Home
              </button>

              <button
                onClick={() => navigateTo('favorites')}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                  currentPage === 'favorites'
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-5 h-5" />
                Favorites
                {userProfile?.favorites?.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full ml-auto">
                    {userProfile.favorites.length}
                  </span>
                )}
              </button>

              {userProfile?.isAdmin && (
                <button
                  onClick={() => navigateTo('admin')}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
                    currentPage === 'admin'
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Admin
                </button>
              )}

              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-600 mb-2">
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true)
                    setShowMobileMenu(false)
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        {currentPage === 'home' && (
          <HomePage accessToken={accessToken} userProfile={userProfile} />
        )}
        {currentPage === 'favorites' && accessToken && (
          <FavoritesPage accessToken={accessToken} />
        )}
        {currentPage === 'admin' && accessToken && userProfile?.isAdmin && (
          <AdminPanel accessToken={accessToken} />
        )}
        {currentPage === 'bootstrap' && user && (
          <AdminBootstrap 
            userEmail={user.email} 
            onSuccess={() => window.location.reload()} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              LastMinuteCamps - Find available campsites across the United States
            </p>
            <p className="text-xs text-gray-500">
              Powered by Recreation.gov and multiple campground providers
            </p>
            {user && !userProfile?.isAdmin && (
              <button
                onClick={() => navigateTo('bootstrap')}
                className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
              >
                <Shield className="w-3 h-3" />
                Become First Admin
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          mode={authMode}
          setMode={setAuthMode}
        />
      )}
    </div>
  )
}

export default App