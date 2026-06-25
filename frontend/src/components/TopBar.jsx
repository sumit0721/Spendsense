import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Calendar, Sun, Moon, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationPanel from './NotificationPanel';
export default function TopBar({ title, subtitle, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [showNotification, setShowNotification] = useState(false);

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
    <header className="h-16 border-b border-outline-variant dark:border-dark-outline-variant bg-surface-container/80 dark:bg-dark-surface-container/80 backdrop-blur px-md md:px-lg flex items-center justify-between sticky top-0 z-10 w-full shrink-0">
      <div className="flex flex-col">
        <h2 className="text-[16px] md:text-[18px] font-sans font-bold text-on-surface leading-none m-0">
          {getPageTitle()}
        </h2>
        {subtitle && (
          <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider mt-[2px]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Dynamic children (e.g. search bars, history controls) */}
      <div className="flex-1 flex justify-center px-md max-w-md">
        {children}
      </div>

      <div className="flex items-center gap-md">
        {/* Home Button */}
        <Link 
          to="/"
          className="p-xs hover:bg-surface-container border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant hover:text-primary rounded-lg transition-all focus:outline-none"
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
        <Link to="/profile" className="flex items-center gap-xs pl-xs border-l border-outline-variant hover:opacity-80 transition-opacity" title="Go to Profile">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[13px] uppercase">
            {user?.name?.slice(0, 1) || 'U'}
          </div>
          <span className="hidden lg:block text-[13px] font-sans font-bold text-on-surface truncate max-w-[120px]">
            {user?.name || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
}
