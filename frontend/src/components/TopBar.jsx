import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Calendar, Sun, Moon, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
            }}
            className="p-xs hover:bg-surface-container border border-outline-variant/60 hover:border-outline-variant text-on-surface-variant hover:text-primary rounded-lg transition-all focus:outline-none relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-[2px] right-[2px] w-2 h-2 bg-error rounded-full ring-2 ring-white" />
          </button>
          {showNotification && (
            <div className="absolute top-10 right-0 w-48 bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline-variant rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <p className="text-[13px] text-on-surface font-medium text-center">No new notifications</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-xs pl-xs border-l border-outline-variant">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[13px] uppercase">
            {user?.name?.slice(0, 1) || 'U'}
          </div>
          <span className="hidden lg:block text-[13px] font-sans font-bold text-on-surface truncate max-w-[120px]">
            {user?.name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}
