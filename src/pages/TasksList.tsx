import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Filter, Plus, FolderGit2 } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';

const TasksList = () => {
  const { tasks, projects, users, loading, addTask } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, projectFilter]);

  if (loading) return <div className="text-slate-500">Loading tasks...</div>;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'ALL' || task.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getAssignedUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.name : 'Unassigned';
  };

  const handleCreateTask = (taskData: any) => {
    addTask(taskData);
    setIsModalOpen(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Task created successfully',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'TODO': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'DOING': return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
      case 'DONE': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'BLOCKED': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'text-emerald-500';
      case 'MEDIUM': return 'text-amber-500';
      case 'HIGH': return 'text-orange-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const renderTaskCard = (task: any) => (
    <div key={task.task_id} className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-center mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(task.status)}`}>
          {task.status}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
          {task.priority} Priority
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h3>
      <p className="text-sm text-slate-500 mb-5">{getProjectName(task.project_id)}</p>
      
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {getAssignedUserName(task.assigned_to).charAt(0)}
          </div>
          <span className="text-sm text-slate-600 font-medium">{getAssignedUserName(task.assigned_to)}</span>
        </div>
        <button 
          onClick={() => navigate(`/tasks/${task.task_id}`)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          View Details &rarr;
        </button>
      </div>
    </div>
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const groupedTasks = projects.map(project => ({
    ...project,
    tasks: paginatedTasks.filter(t => t.project_id === project.project_id)
  })).filter(group => group.tasks.length > 0);

  const unassignedTasks = paginatedTasks.filter(t => !projects.find(p => p.project_id === t.project_id));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all ongoing tasks.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 shrink-0">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1 max-w-[130px] truncate"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 shrink-0">
            <select 
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
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
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 shrink-0">
            <select 
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
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

      <div className="flex flex-col gap-8">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {groupedTasks.map(group => (
              <div key={group.project_id} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900">
                    <FolderGit2 size={20} className="text-indigo-600" />
                    <h2 className="text-lg font-bold">{group.name}</h2>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{group.tasks.length} Tasks</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {group.tasks.map(task => renderTaskCard(task))}
                </div>
              </div>
            ))}

            {unassignedTasks.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FolderGit2 size={20} />
                    <h2 className="text-lg font-bold">Other / Unassigned</h2>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{unassignedTasks.length} Tasks</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {unassignedTasks.map(task => renderTaskCard(task))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-4">
                <span className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} entries
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        initialData={selectedTask}
        projects={projects}
        users={users}
      />
    </div>
  );
};

export default TasksList;
