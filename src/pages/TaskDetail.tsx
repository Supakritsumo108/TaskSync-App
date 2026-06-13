import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Trash2, Edit, CheckCircle2, Clock, User as UserIcon, Calendar, MessageSquare } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, projects, users, loading, updateTask, toggleSubtask, deleteTask } = useData();
  const { currentUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (loading) return <div className="text-slate-500 p-8 flex justify-center">Loading task details...</div>;

  const task = tasks.find(t => t.task_id === id);

  if (!task) {
    return (
      <div className="p-8 text-slate-500 flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <button className="text-blue-600 font-medium hover:underline cursor-pointer" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </button>
      </div>
    );
  }

  const project = projects.find(p => p.project_id === task.project_id);
  const assignedUser = users.find(u => u.user_id === task.assigned_to);

  const handleStatusChange = (newStatus: 'TODO' | 'DOING' | 'DONE' | 'BLOCKED') => {
    updateTask(task.task_id, { status: newStatus });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Status updated',
      showConfirmButton: false,
      timer: 2000
    });
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
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#94a3b8',
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
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const calculateDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? `${days} days left` : 'Overdue';
  };

  const assigneeInitials = assignedUser 
    ? assignedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const completedSubtasksCount = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;
  const subtasksProgress = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-32">
      {/* 
        Added pb-32 (padding-bottom) to prevent overlapping with the AI Chatbot window 
        when it's open on the bottom right.
      */}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer w-fit" 
          onClick={() => navigate('/tasks')}
        >
          <ChevronLeft size={20} />
          Back to Tasks
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer" 
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={16} />
            Edit Task
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer" 
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-6">
        
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColors(task.priority)}`}>
            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()} Priority
          </span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
            Project: {project ? project.name : 'No Project'}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{task.title}</h1>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Status
            </span>
            <select 
              className="w-full max-w-[150px] bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer transition-shadow"
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
            >
              <option value="TODO">To-Do</option>
              <option value="DOING">In Progress</option>
              <option value="DONE">Completed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <UserIcon size={14} /> Assignee
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {assigneeInitials}
              </div>
              <span className="text-sm font-medium text-slate-800 truncate">{assignedUser ? assignedUser.name : 'Unassigned'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Clock size={14} /> Due Date
            </span>
            <span className="text-sm font-medium text-slate-800 mt-1">
              {project?.deadline ? `${project.deadline}` : 'N/A'}
            </span>
            {project?.deadline && (
              <span className="text-xs text-slate-500">{calculateDaysLeft(project.deadline)}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar size={14} /> Created
            </span>
            <span className="text-sm font-medium text-slate-800 mt-1">2026-06-03</span>
          </div>

        </div>
      </div>

      {/* Subtasks Card */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              Subtasks
            </h3>
            <span className="text-sm font-medium text-slate-500">
              {completedSubtasksCount} of {totalSubtasksCount}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-500" 
              style={{ width: `${subtasksProgress}%` }}
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {task.subtasks.map((sub, idx) => (
              <label 
                key={idx} 
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${sub.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  checked={sub.completed}
                  onChange={() => toggleSubtask(task.task_id, idx)}
                />
                <span className={`text-sm font-medium ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {sub.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-600" />
          Comments
        </h3>
        
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
            AP
          </div>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Admin Person</span>
              <span className="text-xs text-slate-500">Yesterday</span>
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
              Confirmed on v2.3.1. Needs review from the QA team before moving to Done.
            </p>
          </div>
        </div>
        
        {/* Mock Add Comment Input */}
        <div className="flex gap-4 mt-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1 flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Post
            </button>
          </div>
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
