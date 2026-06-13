
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const { tasks, projects, users, loading: dataLoading } = useData();
  const { currentUser } = useAuth();

  if (dataLoading) return <div className="glass-panel">Loading dashboard...</div>;

  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const doingCount = tasks.filter(t => t.status === 'DOING').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;

  const doughnutData = {
    labels: ['TODO', 'DOING', 'DONE', 'BLOCKED'],
    datasets: [
      {
        data: [todoCount, doingCount, doneCount, blockedCount],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // Warning (TODO)
          'rgba(99, 102, 241, 0.8)', // Primary (DOING)
          'rgba(16, 185, 129, 0.8)', // Success (DONE)
          'rgba(239, 68, 68, 0.8)'   // Danger (BLOCKED)
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const criticalTasks = tasks.filter(t => t.priority === 'CRITICAL').length;
  const highTasks = tasks.filter(t => t.priority === 'HIGH').length;

  // Get user initial from display name or email
  const userInitial = currentUser?.displayName 
    ? currentUser.displayName.charAt(0).toUpperCase() 
    : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <div className="user-profile-mock">
          <div className="avatar text-avatar">
            {userInitial}
          </div>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon icon-primary"><ListTodo size={24} /></div>
          <div className="kpi-content">
            <h3>Total Tasks</h3>
            <div className="kpi-value">{tasks.length}</div>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon icon-success"><CheckCircle size={24} /></div>
          <div className="kpi-content">
            <h3>Completed</h3>
            <div className="kpi-value">{doneCount}</div>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon icon-warning"><Clock size={24} /></div>
          <div className="kpi-content">
            <h3>In Progress</h3>
            <div className="kpi-value">{doingCount}</div>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon icon-danger"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <h3>Blocked</h3>
            <div className="kpi-value">{blockedCount}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass-panel">
          <h3>Task Status Distribution</h3>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, color: '#f8fafc' }} />
          </div>
        </div>
        
        <div className="glass-panel summary-panel">
          <h3>Project Summary</h3>
          <div className="summary-stats">
            <div className="stat-row">
              <span>Active Projects:</span>
              <strong>{projects.length}</strong>
            </div>
            <div className="stat-row">
              <span>Critical Priority Tasks:</span>
              <strong className="priority-critical">{criticalTasks}</strong>
            </div>
            <div className="stat-row">
              <span>High Priority Tasks:</span>
              <strong className="priority-high">{highTasks}</strong>
            </div>
            <div className="stat-row">
              <span>Total Team Members:</span>
              <strong>{users.length}</strong>
            </div>
          </div>
          <button className="btn w-full mt-4">View All Projects</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
