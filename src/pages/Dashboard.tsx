import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';
import { ListTodo, Plus, Search, FolderGit2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip);

const Dashboard = () => {
  const { tasks, users, projects, loading: dataLoading, addTask } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  if (dataLoading) return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex justify-between items-end">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
            <div className="h-4 w-24 bg-slate-200 rounded-md mb-4"></div>
            <div className="h-10 w-16 bg-slate-200 rounded-md"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="h-6 w-32 bg-slate-200 rounded-md mb-6"></div>
          <div className="h-[300px] bg-slate-100 rounded-xl"></div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="h-6 w-32 bg-slate-200 rounded-md mb-6"></div>
          <div className="h-[300px] w-[300px] mx-auto bg-slate-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const doingCount = tasks.filter(t => t.status === 'DOING').length;
  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;
  const totalCount = tasks.length;
  const totalProjects = projects.length;

  const doughnutData = {
    labels: ['เสร็จแล้ว', 'กำลังทำ', 'รอดำเนินการ (To Do)', 'ติดปัญหา (Blocked)'],
    datasets: [
      {
        data: [doneCount, doingCount, todoCount, blockedCount],
        backgroundColor: ['#10B981', '#F59E0B', '#E2E8F0', '#EF4444'], // Emerald, Amber, Slate, Red
        borderWidth: 0,
        hoverOffset: 6
      },
    ],
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  
  // If filters change and current page is out of bounds, reset to 1
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

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

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'DONE': return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Completed</span>;
      case 'DOING': return <span className="bg-amber-50 text-amber-600 border border-amber-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>In Progress</span>;
      case 'TODO': return <span className="bg-slate-50 text-slate-600 border border-slate-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>To-Do</span>;
      case 'BLOCKED': return <span className="bg-red-50 text-red-600 border border-red-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Blocked</span>;
      default: return null;
    }
  };

  const getPriorityDisplay = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return <span className="text-red-600 font-black tracking-wide text-xs uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">Critical</span>;
      case 'HIGH': return <span className="text-orange-500 font-bold tracking-wide text-xs uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-100">High</span>;
      case 'MEDIUM': return <span className="text-amber-500 font-bold tracking-wide text-xs uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Medium</span>;
      case 'LOW': return <span className="text-slate-400 font-bold tracking-wide text-xs uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Low</span>;
      default: return priority;
    }
  };

  const handleCreateTask = (taskData: any) => {
    addTask(taskData as any);
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

  return (
    <div className="relative min-h-screen bg-slate-50 w-full">
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full pb-16 pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <header className="flex flex-col items-center justify-center text-center mt-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">WorkSpace</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium px-4 py-2">
            ยินดีต้อนรับ, <span className="text-indigo-600 font-bold">{currentUser?.email || 'user@gmail.com'}</span> <span className="hidden sm:inline mx-2 text-slate-300">|</span><span className="block sm:inline mt-1 sm:mt-0">จัดการงานและติดตามประสิทธิภาพของคุณ</span>
          </p>
        </header>

        {/* Top Section: Chart & New KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-8 w-full text-center">ภาพรวมสถานะงานทั้งหมด</h2>
            
            <div className="relative w-44 h-44 mb-8">
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  maintainAspectRatio: false, 
                  cutout: '75%', 
                  plugins: { legend: { display: false }, tooltip: { enabled: true } },
                }} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-slate-900 leading-none mb-1">{totalCount}</span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>เสร็จแล้ว</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>กำลังทำ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span>รอดำเนินการ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>ติดปัญหา</span>
              </div>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Projects</div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FolderGit2 size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900">{totalProjects}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Tasks</div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <ListTodo size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900">{totalCount}</div>
            </div>
          </div>
        </div>

        {/* Tasks List Section */}
        <div className="flex flex-col gap-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">รายการงานทั้งหมด</h2>
            <button 
              className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} strokeWidth={3} />
              New Task
            </button>
          </div>
          
          {/* Filters & Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="ค้นหาชื่องาน..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select 
                className="flex-1 sm:flex-none bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="TODO">To-Do (รอดำเนินการ)</option>
                <option value="DOING">In Progress (กำลังทำ)</option>
                <option value="DONE">Completed (เสร็จแล้ว)</option>
                <option value="BLOCKED">Blocked (ติดปัญหา)</option>
              </select>
              
              <select 
                className="flex-1 sm:flex-none bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer appearance-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="ALL">ความสำคัญทั้งหมด</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Mobile New Task Button */}
            <button 
              className="sm:hidden flex items-center justify-center gap-2 w-full bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} strokeWidth={3} />
              New Task
            </button>
          </div>

          {/* Task Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่องาน</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">ผู้รับผิดชอบ</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะ</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">ความสำคัญ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {currentTasks.length > 0 ? (
                    currentTasks.map((task) => {
                      const assignedUser = users.find(u => u.user_id === task.assigned_to);
                      return (
                        <tr 
                          key={task.task_id} 
                          className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => navigate(`/tasks/${task.task_id}`)}
                        >
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{task.title}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                                {assignedUser?.name.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-semibold text-slate-600">{assignedUser ? assignedUser.name : 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getStatusDisplay(task.status)}
                          </td>
                          <td className="py-4 px-6">
                            {getPriorityDisplay(task.priority)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Search size={40} className="mb-4 text-slate-300" strokeWidth={1} />
                          <p className="font-medium">ไม่พบข้อมูลงานที่ค้นหา</p>
                          <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือตัวกรองสถานะ/ความสำคัญ</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{indexOfFirstTask + 1}</span> to <span className="font-bold text-slate-800">{Math.min(indexOfLastTask, filteredTasks.length)}</span> of <span className="font-bold text-slate-800">{filteredTasks.length}</span> tasks
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
        </div>

        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          initialData={undefined}
          projects={projects}
          users={users}
        />
      </div>
    </div>
  );
};

export default Dashboard;
