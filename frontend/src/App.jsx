import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AIAdvisor from './pages/AIAdvisor';
import Profile from './pages/Profile';
import SavingsGoals from './pages/SavingsGoals';
import RecurringTransactions from './pages/RecurringTransactions';

/**
 * Protected route wrapper — redirects to /auth if not authenticated.
 * Shows a loading state while checking session.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-on-surface-variant font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes — wrapped in AppLayout (Sidebar + MobileNav) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/advisor" element={<AIAdvisor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/goals" element={<SavingsGoals />} />
            <Route path="/recurring" element={<RecurringTransactions />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
