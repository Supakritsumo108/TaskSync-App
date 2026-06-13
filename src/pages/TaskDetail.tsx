import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ChevronLeft, Trash2, Edit } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, projects, users, loading, updateTask, toggleSubtask, deleteTask } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (loading) return <div className="text-slate-500 p-8">Loading...</div>;

  const task = tasks.find(t => t.task_id === id);

  if (!task) {
    return (
      <div className="p-8 text-slate-500 flex flex-col items-start gap-4">
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <button className="text-indigo-600 font-medium" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </button>
      </div>
    );
  }

  const project = projects.find(p => p.project_id === task.project_id);
  const assignedUser = users.find(u => u.user_id === task.assigned_to);

  const handleStatusChange = (newStatus: 'TODO' | 'DOING' | 'DONE' | 'BLOCKED') => {
    updateTask(task.task_id, { status: newStatus });
  };

  const handleUpdateTask = (taskData: any) => {
    updateTask(task.task_id, taskData);
    setIsEditModalOpen(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Task updated successfully',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this task!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e', // rose-500
      cancelButtonColor: '#94a3b8', // slate-400
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteTask(task.task_id);
        Swal.fire(
          'Deleted!',
          'Your task has been deleted.',
          'success'
        );
        navigate('/tasks');
      }
    });
  };

  const getPriorityColors = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-red-50 text-red-600';
      case 'MEDIUM': return 'bg-amber-50 text-amber-600';
      case 'LOW': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const calculateDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? `${days}d left` : 'Overdue';
  };

  const assigneeInitials = assignedUser 
    ? assignedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col max-w-3xl animate-in fade-in duration-300 text-slate-800 relative">
      <div className="flex items-center justify-between mb-8">
        <button 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} />
          Back to tasks
        </button>

        <div className="flex items-center gap-2">
          <button className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer" title="Edit" onClick={() => setIsEditModalOpen(true)}>
            <Edit size={16} />
          </button>
          <button className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer" title="Delete" onClick={handleDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColors(task.priority)}`}>
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </span>
        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">
          {project ? project.name : 'No Project'}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-4">{task.title}</h1>
      
      <p className="text-sm text-slate-700 mb-10 leading-relaxed">
        {task.title.toLowerCase().includes('bug') 
          ? "Users are being logged out unexpectedly. Root cause traced to token refresh logic in middleware." 
          : `This task belongs to the ${project?.name || 'unknown'} project. Ensure to coordinate with ${assignedUser?.name || 'the team'} for further updates.`}
      </p>

      <div className="grid grid-cols-2 gap-y-8 max-w-md mb-12">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-900 font-medium">Status</span>
          <select 
            className="w-fit bg-slate-100 border-none text-slate-600 py-1.5 pl-3 pr-8 rounded-md text-sm font-medium focus:ring-0 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] bg-[length:14px]"
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
          >
            <option value="TODO">Todo</option>
            <option value="DOING">Doing</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-900 font-medium">Assignee</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
              {assigneeInitials}
            </div>
            <span className="text-sm text-slate-600">{assignedUser ? assignedUser.name : 'Unassigned'}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-900 font-medium">Due date</span>
          <span className="text-sm text-slate-600">
            {project?.deadline ? `${project.deadline} (${calculateDaysLeft(project.deadline)})` : 'N/A'}
          </span>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-900 font-medium">Created</span>
          <span className="text-sm text-slate-600">2026-06-03</span>
        </div>
      </div>

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Subtasks</h3>
          <div className="flex flex-col gap-4">
            {task.subtasks.map((sub, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  checked={sub.completed}
                  onChange={() => toggleSubtask(task.task_id, idx)}
                />
                <span className={`text-sm ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {sub.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-12">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Comments</h3>
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
            AP
          </div>
          <p className="text-sm text-slate-700 mt-1.5">Confirmed on v2.3.1</p>
        </div>
      </div>

      <TaskModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateTask}
        initialData={task}
        projects={projects}
        users={users}
      />
    </div>
  );
};

export default TaskDetail;
