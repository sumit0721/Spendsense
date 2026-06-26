import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, Sparkles, LogOut, Wallet, Target, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Savings Goals', path: '/goals', icon: Target },
    { name: 'Recurring', path: '/recurring', icon: Repeat },
    { name: 'AI Advisor', path: '/advisor', icon: Sparkles },
  ];

  return (
    <aside className="w-64 border-r border-outline-variant/50 h-screen bg-gradient-to-b from-surface-container-lowest to-surface-container-low flex flex-col justify-between fixed top-0 left-0 hidden md:flex z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-lg p-lg">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-xs hover:opacity-80 transition-opacity">
          <div className="p-xs bg-primary text-on-primary rounded-lg shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[18px] font-sans font-extrabold text-primary tracking-tight">
            SpendSense
          </span>
        </NavLink>

        {/* Navigation links */}
        <nav className="flex flex-col gap-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-sm px-md py-sm rounded-lg text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary hover:shadow-sm'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-lg border-t border-outline-variant dark:border-dark-outline-variant flex flex-col gap-md">
        <Link to="/profile" className="flex items-center gap-sm hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[14px] uppercase">
            {user?.name?.slice(0, 2) || 'US'}
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="text-[14px] font-sans font-bold text-on-surface block truncate">
              {user?.name || 'User'}
            </span>
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider block truncate">
              {user?.email || 'user@example.com'}
            </span>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-sm px-md py-[10px] w-full text-[13px] font-medium text-error hover:bg-error/5 rounded-lg transition-colors border border-transparent hover:border-error/10 focus:outline-none"
        >
          <LogOut className="w-[16px] h-[16px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
