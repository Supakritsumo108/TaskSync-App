import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import Sidebar from './components/Sidebar';
import AIChatbot from './components/AIChatbot';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';

// Lazy loaded components for better Performance (Lighthouse)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TasksList = React.lazy(() => import('./pages/TasksList'));
const TaskDetail = React.lazy(() => import('./pages/TaskDetail'));
const KanbanBoard = React.lazy(() => import('./pages/KanbanBoard'));
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

  return (
    <div className={isAuthPage ? "min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center" : "flex min-h-screen bg-slate-50 text-slate-800"}>
      {!isAuthPage && <Sidebar />}
      
      {/* Semantic main tag for Accessibility */}
      <main className={isAuthPage ? "w-full flex items-center justify-center" : "flex-1 ml-64 p-8 pb-28 bg-slate-50 min-h-screen"}>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TasksList /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
            <Route path="/board" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
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
