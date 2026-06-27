
import { useState } from 'react';
import { useLocation, Link, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Sun, Moon, Home, Menu, X, LayoutDashboard, Receipt, Target, Repeat, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationPanel from './NotificationPanel';

export default function TopBar({ title, subtitle, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  
  const getPageTitle = () => {
    if (title) return title;
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/transactions':
        return 'Transactions';
      case '/advisor':
        return 'AI Financial Advisor';
      default:
        return 'Overview';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
    <header className="h-16 border-b border-outline-variant bg-surface shadow-sm px-2 md:px-lg flex items-center justify-between sticky top-0 z-40 w-full shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-[16px] md:text-[18px] font-sans font-bold text-on-surface leading-none m-0">
            {getPageTitle()}
          </h2>
          {subtitle && (
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider mt-[2px] truncate max-w-[150px] md:max-w-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic children (e.g. search bars, history controls) */}
      <div className="flex-1 flex justify-center px-1 sm:px-md min-w-0">
        {children}
      </div>

      <div className="flex items-center gap-1 sm:gap-md shrink-0">
        {/* Home Button */}
        <Link 
          to="/"
          className="hidden sm:flex p-xs hover:bg-surface-container border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant hover:text-primary rounded-lg transition-all focus:outline-none"
          title="Go to Home"
        >
          <Home className="w-[18px] h-[18px]" />
        </Link>

        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-xs text-[13px] font-medium text-on-surface-variant border border-outline-variant dark:border-dark-outline-variant bg-surface dark:bg-dark-surface-container-low px-sm py-[6px] rounded-lg">
          <Calendar className="w-4 h-4 text-secondary" />
          <span>{currentDate}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-xs hover:bg-surface-container border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant hover:text-primary rounded-lg transition-all focus:outline-none"
        >
          {isDark
            ? <Sun className="w-[18px] h-[18px] text-yellow-400" />
            : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications button */}
        <NotificationPanel />

        {/* User Info */}
        <button 
          onClick={() => {
            if (location.pathname === '/profile') {
              navigate(-1);
            } else {
              navigate('/profile');
            }
          }} 
          className="flex items-center gap-xs pl-xs border-l border-outline-variant hover:opacity-80 transition-opacity focus:outline-none" 
          title="Toggle Profile"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[13px] uppercase">
            {user?.name?.slice(0, 1) || 'U'}
          </div>
          <span className="hidden lg:block text-[13px] font-sans font-bold text-on-surface truncate max-w-[120px]">
            {user?.name || 'User'}
          </span>
        </button>
      </div>
    </header>

    {/* Mobile Navigation Drawer */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 flex md:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Drawer */}
        <div className="relative w-64 max-w-[80%] bg-surface-container h-full flex flex-col shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between p-4 border-b border-outline-variant">
            <span className="text-[18px] font-sans font-extrabold text-primary tracking-tight">SpendSense</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
            {[
              { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
              { name: 'Transactions', path: '/transactions', icon: Receipt },
              { name: 'Savings Goals', path: '/goals', icon: Target },
              { name: 'Recurring', path: '/recurring', icon: Repeat },
              { name: 'AI Advisor', path: '/advisor', icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary font-bold shadow-md'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
          
          <div className="mt-auto border-t border-outline-variant p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-bold text-[14px] text-on-surface uppercase">
                {user?.name?.slice(0, 2) || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-on-surface truncate">{user?.name || 'User'}</span>
                <span className="text-[11px] text-on-surface-variant truncate uppercase tracking-wider">{user?.email || 'USER@EXAMPLE.COM'}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
                navigate('/auth');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-error hover:bg-error-container/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
