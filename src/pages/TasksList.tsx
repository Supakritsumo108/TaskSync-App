import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Plus, Folder, ArrowLeft, GripHorizontal, Pencil, Trash2, Clock, ArrowUpDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import Swal from 'sweetalert2';

const TasksList = () => {
  const { tasks, projects, users, loading, addTask, reorderProjects, getOrCreateProjectByName, getOrCreateUserByName, updateProject, deleteProject } = useData();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearchTerm, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'UPDATED' | 'NEWEST' | 'OLDEST'>('UPDATED');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectToEdit, setSelectedProjectToEdit] = useState<any>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(location.state?.projectId || null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [currentProjectPage, setCurrentProjectPage] = useState(1);
  const projectsPerPage = 9;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    reorderProjects(result.source.index, result.destination.index);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, selectedProjectId]);

  if (loading) return (
    <div className="flex flex-col gap-8 p-8 flex justify-center items-center h-full text-slate-500">
      Loading...
    </div>
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesProject = selectedProjectId ? task.project_id === selectedProjectId : false;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  }).sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    const createA = new Date(a.created_at || 0).getTime();
    const createB = new Date(b.created_at || 0).getTime();
    
    if (sortBy === 'UPDATED') return timeB - timeA;
    if (sortBy === 'NEWEST') return createB - createA;
    if (sortBy === 'OLDEST') return createA - createB;
    return 0;
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
    // Resolve IDs
    const finalProjectId = taskData.project_id ? getOrCreateProjectByName(taskData.project_id) : undefined;
    const finalAssigneeId = taskData.assigned_to ? getOrCreateUserByName(taskData.assigned_to) : undefined;

    const finalTaskData = {
      ...taskData,
      project_id: finalProjectId,
      assigned_to: finalAssigneeId
    };

    addTask(finalTaskData);
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

  const handleEditProject = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setSelectedProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    Swal.fire({
      title: t('projects.deleteConfirm'),
      text: t('projects.deleteText').replace('{name}', projectName),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: t('projects.deleteYes'),
      cancelButtonText: t('projects.deleteCancel')
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProject(projectId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: t('projects.deleteSuccess'),
          showConfirmButton: false,
          timer: 3000
        });
      }
    });
  };

  const handleProjectSubmit = (projectData: any) => {
    if (selectedProjectToEdit) {
      updateProject(selectedProjectToEdit.project_id, projectData);
    }
    setIsProjectModalOpen(false);
    setSelectedProjectToEdit(null);
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
      <td className="p-4 align-middle">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${getStatusBadgeColor(task.status)}`}>
          {task.status}
        </span>
      </td>
      <td className="p-4 align-middle hidden sm:table-cell">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="p-4 align-middle hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {getAssignedUserName(task.assigned_to).substring(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-slate-700">{getAssignedUserName(task.assigned_to)}</span>
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

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase()));
  const totalProjectPages = Math.ceil(filteredProjects.length / projectsPerPage);
  
  // Ensure we don't end up on an empty page
  if (currentProjectPage > totalProjectPages && totalProjectPages > 0) {
    setCurrentProjectPage(1);
  }
  
  const paginatedProjects = filteredProjects.slice(
    (currentProjectPage - 1) * projectsPerPage,
    currentProjectPage * projectsPerPage
  );

  const currentProjectName = selectedProjectId 
    ? projects.find(p => p.project_id === selectedProjectId)?.name 
    : undefined;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      {selectedProjectId === null ? (
        <>
          <header className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {t('projects.title')}
                </h1>
                <p className="text-slate-500 mt-1 text-sm sm:text-base">
                  {t('projects.subtitle')}
                </p>
              </div>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
                onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
              >
                <Plus size={18} strokeWidth={3} />
                <span className="hidden sm:inline">{t('tasks.newTask')}</span>
                <span className="sm:hidden">{t('tasks.newTask')}</span>
              </button>
            </div>
          </header>

          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
              placeholder={t('projects.search')}
              value={projectSearchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="projects" direction="horizontal">
              {(provided) => (
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {paginatedProjects
                    .map((project, index) => {
                      const projectTasks = tasks.filter(t => t.project_id === project.project_id);
              const completedTasks = projectTasks.filter(t => t.status === 'DONE').length;
              const progress = projectTasks.length ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
              
              return (
                <Draggable key={project.project_id} draggableId={project.project_id} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      onClick={() => setSelectedProjectId(project.project_id)}
                      className={`bg-white border ${snapshot.isDragging ? 'border-indigo-500 shadow-2xl scale-105 z-50 ring-4 ring-indigo-500/10' : 'border-slate-200 shadow-sm'} rounded-2xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-white rounded-bl-[100px] -z-10 opacity-50"></div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <Folder size={24} strokeWidth={2.5} />
                          </div>
                          <div 
                            {...provided.dragHandleProps} 
                            className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripHorizontal size={18} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            onClick={(e) => handleEditProject(e, project)}
                            title={t('projects.edit')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            onClick={(e) => handleDeleteProject(e, project.project_id, project.name)}
                            title={t('projects.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</h3>
                        {project.deadline && (
                          <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md w-fit ${
                            new Date(project.deadline) < new Date() ? 'bg-red-50 text-red-600' :
                            new Date(project.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000 ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            <Clock size={12} />
                            {new Date(project.deadline) < new Date() ? t('projects.overdue') :
                             new Date(project.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000 ? t('projects.dueSoon') :
                             t('projects.onTrack')}: {new Date(project.deadline).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100/80">
                        <div className="flex justify-between items-end mb-3">
                          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t('projects.progress')}</div>
                          <div className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{progress}%</div>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold">
                          <div className="flex-1 bg-slate-50 border border-slate-100 py-1.5 text-center rounded-lg text-slate-500">
                            {projectTasks.filter(t => t.status === 'TODO').length} {t('dashboard.todo')}
                          </div>
                          <div className="flex-1 bg-amber-50 border border-amber-100 py-1.5 text-center rounded-lg text-amber-600">
                            {projectTasks.filter(t => t.status === 'DOING').length} {t('dashboard.doing')}
                          </div>
                          <div className="flex-1 bg-emerald-50 border border-emerald-100 py-1.5 text-center rounded-lg text-emerald-600">
                            {completedTasks} {t('dashboard.done')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>

    {/* Pagination Controls for Projects */}
    {totalProjectPages > 1 && (
      <div className="flex justify-center mt-8 mb-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setCurrentProjectPage(prev => Math.max(1, prev - 1))}
            disabled={currentProjectPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex gap-1">
            {getPaginationItems(currentProjectPage, totalProjectPages).map((item, index) => (
              <button
                key={index}
                onClick={() => typeof item === 'number' && setCurrentProjectPage(item)}
                disabled={item === '...'}
                className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all
                  ${item === currentProjectPage 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : item === '...' 
                      ? 'text-slate-400 cursor-default' 
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentProjectPage(prev => Math.min(totalProjectPages, prev + 1))}
            disabled={currentProjectPage === totalProjectPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors rotate-180"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    )}
  </>
) : (
  // VIEW B: TASKS LIST FOR SPECIFIC PROJECT
        <div className="flex flex-col gap-8 animate-in slide-in-from-right-8 duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm mb-4 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> {t('tasks.backToProjects')}
              </button>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Folder className="text-indigo-600" />
                {getProjectName(selectedProjectId)}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{t('tasks.manageTasks')}</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto sm:mt-8" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}>
              <Plus size={18} strokeWidth={3} /> {t('tasks.newTask')}
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
            {/* Search — full width */}
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800"
                placeholder={t('tasks.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters — grid 2-col on mobile, 3-col on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2rem",
                }}
              >
                <option value="ALL">{t('status.all')}</option>
                <option value="TODO">{t('status.todo')}</option>
                <option value="DOING">{t('status.doing')}</option>
                <option value="DONE">{t('status.done')}</option>
                <option value="BLOCKED">{t('status.blocked')}</option>
              </select>

              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2rem",
                }}
              >
                <option value="ALL">{t('priority.all')}</option>
                <option value="LOW">{t('priority.low')}</option>
                <option value="MEDIUM">{t('priority.medium')}</option>
                <option value="HIGH">{t('priority.high')}</option>
                <option value="CRITICAL">{t('priority.critical')}</option>
              </select>

              <div className="relative col-span-2 sm:col-span-1">
                <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="UPDATED">{t('sort.updated')}</option>
                  <option value="NEWEST">{t('sort.newest')}</option>
                  <option value="OLDEST">{t('sort.oldest')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center">
                <img src="/illustrations/empty-tasks.png" alt="No tasks" className="w-56 h-auto mb-6 opacity-90 drop-shadow-sm mix-blend-multiply" />
                <h3 className="font-bold text-xl text-slate-800">{t('tasks.noTasksTitle')}</h3>
                <p className="text-slate-500 mt-2">{t('tasks.noTasksDesc')}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                        <th className="p-4 font-bold">{t('table.name')}</th>
                        <th className="p-4 font-bold">{t('table.status')}</th>
                        <th className="p-4 font-bold hidden sm:table-cell">{t('table.priority')}</th>
                        <th className="p-4 font-bold hidden md:table-cell">{t('table.assignee')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTasks.map(task => renderTableRow(task))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-white gap-4">
                    <div className="text-sm text-slate-500">
                      {t('tasks.showing').replace('{start}', String((currentPage - 1) * itemsPerPage + 1)).replace('{end}', String(Math.min(currentPage * itemsPerPage, filteredTasks.length))).replace('{total}', String(filteredTasks.length))}
                    </div>
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
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTask}
        initialData={selectedTask}
        defaultProjectName={currentProjectName}
        projects={projects}
        users={users}
      />
      
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setSelectedProjectToEdit(null); }}
        onSubmit={handleProjectSubmit}
        initialData={selectedProjectToEdit}
      />
    </div>
  );
};

export default TasksList;
