import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Home, History, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ProtectedLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/history') return 'history';
    if (location.pathname === '/search') return 'search';
    return 'home';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/history') {
      setActiveTab('history');
    } else if (location.pathname === '/search') {
      setActiveTab('search');
    } else {
      setActiveTab('home');
    }
    // Close drawer on mobile when route changes
    if (window.innerWidth < 768) {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab: 'home' | 'history' | 'search') => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'history') {
      navigate('/history');
    } else {
      navigate('/search');
    }
    // Close drawer on mobile when navigation item is clicked
    if (window.innerWidth < 768) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side Drawer - Always visible on desktop, toggleable on mobile */}
      <div
        className={`fixed md:static top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out flex-shrink-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-700 to-slate-800">
            <h2 className="text-xl font-bold text-white">Print Station</h2>
            <button
              onClick={toggleDrawer}
              className="md:hidden p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              <button
                onClick={() => handleTabChange('home')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all touch-manipulation ${
                  activeTab === 'home'
                    ? 'bg-slate-50 text-slate-700 shadow-sm border border-slate-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-slate-700' : 'text-gray-500'}`} />
                <span>Home</span>
              </button>
              <button
                onClick={() => handleTabChange('search')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all touch-manipulation ${
                  activeTab === 'search'
                    ? 'bg-slate-50 text-slate-700 shadow-sm border border-slate-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-slate-700' : 'text-gray-500'}`} />
                <span>Search</span>
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all touch-manipulation ${
                  activeTab === 'history'
                    ? 'bg-slate-50 text-slate-700 shadow-sm border border-slate-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <History className={`w-5 h-5 ${activeTab === 'history' ? 'text-slate-700' : 'text-gray-500'}`} />
                <span>History</span>
              </button>
            </div>
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 px-3 py-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 hover:border-red-300 transition-all touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleDrawer}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* Menu Button - Only visible on mobile */}
                <button
                  onClick={toggleDrawer}
                  className="md:hidden p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation"
                  aria-label="Toggle menu"
                >
                  {drawerOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
                <h1 className="text-xl font-bold text-slate-700 md:hidden">
                  Print Station
                </h1>
                {/* Desktop Title */}
                <h1 className="hidden md:block text-xl font-bold text-gray-900">
                  {activeTab === 'home' ? 'Print Stations' : activeTab === 'search' ? 'Search' : 'Print History'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Search Icon - Only visible on mobile */}
                <button
                  onClick={() => {
                    navigate('/search');
                    if (window.innerWidth < 768) {
                      setDrawerOpen(false);
                    }
                  }}
                  className="md:hidden p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation"
                  aria-label="Search"
                >
                  <Search className="w-6 h-6" />
                </button>
                <span className="hidden sm:inline text-sm text-gray-600">
                  Welcome, <span className="font-semibold text-gray-900">{user?.fullName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

