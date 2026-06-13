import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Filter } from 'lucide-react';
import './TasksList.css';

const TasksList = () => {
  const { tasks, projects, users, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  if (loading) return <div className="glass-panel">Loading tasks...</div>;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getAssignedUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.name : 'Unassigned';
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1 className="page-title">Tasks Directory</h1>
        <p className="page-subtitle">Manage and track all ongoing tasks.</p>
      </div>

      <div className="glass-panel filters-panel">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <Filter size={18} />
            <select 
              className="input-field select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="TODO">To Do</option>
              <option value="DOING">Doing</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              className="input-field select-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="tasks-grid">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel no-results">
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.task_id} className="task-card glass-panel">
              <div className="task-card-header">
                <span className={`status-badge status-${task.status.toLowerCase()}`}>
                  {task.status}
                </span>
                <span className={`priority-text priority-${task.priority.toLowerCase()}`}>
                  {task.priority} Priority
                </span>
              </div>
              
              <h3 className="task-title">{task.title}</h3>
              <p className="task-project">{getProjectName(task.project_id)}</p>
              
              <div className="task-card-footer">
                <div className="assignee">
                  <div className="assignee-avatar">
                    {getAssignedUserName(task.assigned_to).charAt(0)}
                  </div>
                  <span>{getAssignedUserName(task.assigned_to)}</span>
                </div>
                <Link to={`/tasks/${task.task_id}`} className="btn btn-outline btn-sm">View Details</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksList;
