import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Sparkles } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'AI Advisor', path: '/advisor', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-outline-variant dark:border-dark-outline-variant bg-surface-container/95 dark:bg-dark-surface-container/95 backdrop-blur flex items-center justify-around md:hidden z-20 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-[4px] py-xs w-full text-[11px] font-semibold transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-[6px] rounded-full transition-all ${isActive ? 'bg-primary/5 text-primary scale-115' : 'text-on-surface-variant'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
