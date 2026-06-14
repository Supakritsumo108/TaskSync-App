import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { Suspense, useState } from 'react';
import Sidebar from './components/Sidebar';
import AIChatbot from './components/AIChatbot';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

// Lazy loaded components for better Performance (Lighthouse)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TasksList = React.lazy(() => import('./pages/TasksList'));
const TaskDetail = React.lazy(() => import('./pages/TaskDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

// Global Fallback Loader
const GlobalLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="three-body">
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={isAuthPage ? "min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center" : "flex min-h-screen bg-slate-50 text-slate-800"}>
      
      {!isAuthPage && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Top Navbar — only on app pages */}
      {!isAuthPage && (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-[80] bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-4 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TaskSync" className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">TaskSync</span>
          </Link>
        </header>
      )}

      {/* Semantic main tag for Accessibility */}
      <main className={
        isAuthPage
          ? "w-full flex items-center justify-center"
          : "flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pb-28 bg-slate-50 min-h-screen pt-[72px] lg:pt-8"
      }>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TasksList /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>

      {!isAuthPage && <AIChatbot />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
