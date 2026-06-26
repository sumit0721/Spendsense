import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface dark:bg-dark-surface flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar for Desktop & Mobile Hamburger */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Dynamic Nested Content */}
        <main className="flex-1 animate-fade-in flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
