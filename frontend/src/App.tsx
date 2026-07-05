import React, { useState } from 'react';
console.log("Vercel production build triggered.");
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Layout
// We keep Sidebar and Header files, but their internal text will be updated
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Login from './pages/Authentication/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Plants from './pages/Plants/Plants';
import Workforce from './pages/Workforce/Workforce';
import OperationsReports from './pages/Reports/OperationsReports';
import Documents from './pages/Documents/Documents';
import Analytics from './pages/Analytics/Analytics';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import AuditLogs from './pages/Audit/AuditLogs';

// Helper Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Global Layout Wrapper for Authenticated Pages
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-slate-900/20 backdrop-filter backdrop-blur-xs z-30 md:hidden"
        ></div>
      )}

      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 pb-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Enterprise Admin Only Routes */}
            <Route
              path="/plants"
              element={
                <ProtectedRoute allowedRoles={['Enterprise Admin']}>
                  <Plants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Enterprise Admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['Enterprise Admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Shared Routes */}
            <Route path="/workforce" element={<Workforce />} />
            <Route path="/operations-reports" element={<OperationsReports />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
