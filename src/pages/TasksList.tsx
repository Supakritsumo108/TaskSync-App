import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Filter, Plus } from 'lucide-react';
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
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, projectFilter]);

  if (loading) return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
      </div>
      
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="h-10 w-full max-w-md bg-slate-100 rounded-lg"></div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-100 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-100 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-100 rounded-lg"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-slate-100 p-4 flex items-center justify-between">
            <div className="h-4 w-1/5 bg-slate-100 rounded-md"></div>
            <div className="h-4 w-1/5 bg-slate-100 rounded-md"></div>
            <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
            <div className="h-4 w-16 bg-slate-100 rounded-md"></div>
            <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );

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
      case 'TODO': return 'bg-slate-100 text-slate-700';
      case 'DOING': return 'bg-amber-50 text-amber-700';
      case 'DONE': return 'bg-emerald-50 text-emerald-700';
      case 'BLOCKED': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md';
      case 'HIGH': return 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md';
      case 'CRITICAL': return 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md';
      default: return 'text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md';
    }
  };

  const renderTableRow = (task: any) => (
    <tr 
      key={task.task_id} 
      onClick={() => navigate(`/tasks/${task.task_id}`)}
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
    >
      <td className="p-4 align-middle">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
      </td>
      <td className="p-4 align-middle text-sm text-slate-500 font-medium">
        {getProjectName(task.project_id)}
      </td>
      <td className="p-4 align-middle">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusBadgeColor(task.status)}`}>
          {task.status}
        </span>
      </td>
      <td className="p-4 align-middle">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="p-4 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {getAssignedUserName(task.assigned_to).charAt(0)}
          </div>
          <span className="text-sm text-slate-600 font-medium">{getAssignedUserName(task.assigned_to)}</span>
        </div>
      </td>
    </tr>
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationItems = (current: number, total: number) => {
    if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
    const items: (number | string)[] = [1];
    if (current <= 4) {
      items.push(2, 3, 4, 5, '...');
    } else if (current >= total - 3) {
      items.push('...', total - 4, total - 3, total - 2, total - 1);
    } else {
      items.push('...', current - 1, current, current + 1, '...');
    }
    items.push(total);
    return items;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all ongoing tasks.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}>
          <Plus size={18} strokeWidth={3} /> New Task
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800"
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer py-1 max-w-[150px] truncate"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer py-1"
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
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer py-1"
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center">
            <img src="/illustrations/empty-tasks.png" alt="No tasks" className="w-56 h-auto mb-6 opacity-90 drop-shadow-sm mix-blend-multiply" />
            <h3 className="font-bold text-xl text-slate-800">No tasks found</h3>
            <p className="text-slate-500 mt-2">There are no tasks matching your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 font-bold">Task Name</th>
                    <th className="p-4 font-bold">Project</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Priority</th>
                    <th className="p-4 font-bold">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map(task => renderTableRow(task))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-white gap-4">
                <span className="text-sm text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of <span className="font-bold text-slate-800">{filteredTasks.length}</span> tasks
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  
                  {getPaginationItems(currentPage, totalPages).map((item, index) => (
                    item === '...' ? (
                      <span key={`ellipsis-${index}`} className="flex items-center justify-center w-8 h-8 text-slate-400 font-medium">...</span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        onClick={() => setCurrentPage(item as number)}
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          currentPage === item 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  ))}

                  <button 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
