
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TasksList from './pages/TasksList';
import TaskDetail from './pages/TaskDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AIChatbot from './components/AIChatbot';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';

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
    <div className={isAuthPage ? "" : "app-layout"}>
      {!isAuthPage && <Sidebar />}
      <main className={isAuthPage ? "" : "main-content"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TasksList />
            </ProtectedRoute>
          } />
          <Route path="/tasks/:id" element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          } />
        </Routes>
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
