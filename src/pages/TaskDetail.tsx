
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Calendar, User as UserIcon, Tag, Edit, Trash2 } from 'lucide-react';
import './TaskDetail.css';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, projects, users, loading } = useData();

  if (loading) return <div className="glass-panel">Loading...</div>;

  const task = tasks.find(t => t.task_id === id);

  if (!task) {
    return (
      <div className="glass-panel not-found">
        <h2>Task Not Found</h2>
        <button className="btn mt-4" onClick={() => navigate('/tasks')}>Back to Tasks</button>
      </div>
    );
  }

  const project = projects.find(p => p.project_id === task.project_id);
  const assignedUser = users.find(u => u.user_id === task.assigned_to);

  return (
    <div className="task-detail-container">
      <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="glass-panel task-main-card">
        <div className="detail-header">
          <div className="header-badges">
            <span className={`status-badge status-${task.status.toLowerCase()}`}>
              {task.status}
            </span>
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
              {task.priority} Priority
            </span>
          </div>
          <div className="action-buttons">
            <button className="btn btn-outline btn-icon" title="Edit"><Edit size={18} /></button>
            <button className="btn btn-outline btn-icon text-danger" title="Delete"><Trash2 size={18} /></button>
          </div>
        </div>

        <h1 className="task-detail-title">{task.title}</h1>
        <p className="task-detail-id">Task ID: {task.task_id}</p>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-icon"><Tag size={20} /></div>
            <div className="detail-info">
              <label>Project</label>
              <span>{project ? project.name : 'Unknown Project'}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="detail-icon"><UserIcon size={20} /></div>
            <div className="detail-info">
              <label>Assignee</label>
              <span>{assignedUser ? assignedUser.name : 'Unassigned'}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <div className="detail-icon"><Calendar size={20} /></div>
            <div className="detail-info">
              <label>Project Deadline</label>
              <span>{project ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="task-description">
          <h3>Description</h3>
          <p>
            This task belongs to the {project?.name} project. The current status is marked as 
            <strong> {task.status}</strong> with a <strong>{task.priority}</strong> priority level. 
            Ensure to coordinate with {assignedUser?.name} for further updates.
          </p>
        </div>
        
        {assignedUser && (
          <div className="assignee-card">
            <div className="assignee-avatar-large">
              {assignedUser.name.charAt(0)}
            </div>
            <div className="assignee-details">
              <h4>{assignedUser.name}</h4>
              <p>{assignedUser.email} • {assignedUser.phone}</p>
              <p className="role-tag">{assignedUser.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
