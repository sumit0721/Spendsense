import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface dark:bg-dark-surface flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:ml-64 pb-16 md:pb-0 min-h-screen">
        {/* Dynamic Nested Content */}
        <main className="flex-1 animate-fade-in flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Mobile Nav for Phones */}
      <MobileNav />
    </div>
  );
}
