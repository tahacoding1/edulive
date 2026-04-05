import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import LandingPage   from './pages/LandingPage';
import AuthPage      from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ClassroomPage from './pages/ClassroomPage';
import AdminPage     from './pages/AdminPage';
import NotFoundPage  from './pages/NotFoundPage';

function Spinner() {
  return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-textDim text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"     element={<LandingPage />} />
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard"          element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/classroom/:roomId"  element={<PrivateRoute><ClassroomPage /></PrivateRoute>} />
      <Route path="/admin"              element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#162040',
            border: '1px solid #1c2d4f',
            color: '#dce8ff',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#00e676', secondary: '#162040' } },
          error:   { iconTheme: { primary: '#ff3d71', secondary: '#162040' } },
        }}
      />
    </AuthProvider>
  );
}
