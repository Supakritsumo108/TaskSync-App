import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Plus } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';

ChartJS.register(ArcElement, Tooltip);

const Dashboard = () => {
  const { tasks, projects, users, loading: dataLoading, addTask } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  if (dataLoading) return <div className="text-slate-500 flex justify-center p-10">Loading dashboard...</div>;

  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const doingCount = tasks.filter(t => t.status === 'DOING').length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;
  const totalCount = tasks.length;

  const criticalCount = tasks.filter(t => t.priority === 'CRITICAL').length;
  const highCount = tasks.filter(t => t.priority === 'HIGH').length;
  const mediumCount = tasks.filter(t => t.priority === 'MEDIUM').length;
  const lowCount = tasks.filter(t => t.priority === 'LOW').length;

  const doughnutData = {
    labels: ['เสร็จแล้ว', 'กำลังทำ', 'รอดำเนินการ (TODO)', 'ติดปัญหา'],
    datasets: [
      {
        data: [
          doneCount, 
          doingCount, 
          tasks.filter(t => t.status === 'TODO').length,
          blockedCount
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#E2E8F0', '#EF4444'], // Emerald, Amber, Slate, Red
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  // Urgent tasks: Sort by priority (CRITICAL > HIGH > MEDIUM > LOW), exclude DONE
  const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const urgentTasks = tasks
    .filter(t => t.status !== 'DONE')
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
    .slice(0, 5);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'DONE': return <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">Completed</span>;
      case 'DOING': return <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold">In Progress</span>;
      case 'TODO': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">To-Do</span>;
      case 'BLOCKED': return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">Blocked</span>;
      default: return null;
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full pb-10 pt-6">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {currentUser?.email || 'User'}
          </p>
        </div>
        <button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
        >
          <Plus size={18} />
          New Task
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-slate-900">{totalCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Completed</div>
          <div className="text-3xl font-bold text-emerald-600">{doneCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">In Progress</div>
          <div className="text-3xl font-bold text-amber-500">{doingCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Blocked</div>
          <div className="text-3xl font-bold text-red-500">{blockedCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-1 flex flex-col items-center justify-center">
          <h2 className="text-base font-bold text-slate-800 mb-6 self-start">Status Overview</h2>
          <div className="relative w-48 h-48 mb-8">
            <Doughnut 
              data={doughnutData} 
              options={{ 
                maintainAspectRatio: false, 
                cutout: '75%', 
                plugins: { legend: { display: false }, tooltip: { enabled: true } } 
              }} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 leading-none mb-1">{totalCount}</span>
              <span className="text-xs text-slate-500 font-medium">ทั้งหมด</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2 text-sm font-medium text-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span>เสร็จแล้ว</span></div>
              <span className="font-bold text-slate-900">{doneCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span>กำลังทำ</span></div>
              <span className="font-bold text-slate-900">{doingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span>รอดำเนินการ</span></div>
              <span className="font-bold text-slate-900">{tasks.filter(t => t.status === 'TODO').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>ติดปัญหา</span></div>
              <span className="font-bold text-slate-900">{blockedCount}</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown & Urgent Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Priority Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-800">Priority Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 p-3 rounded-lg border border-red-100 bg-red-50">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical</span>
                <span className="text-2xl font-bold text-red-700">{criticalCount}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg border border-orange-100 bg-orange-50">
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">High</span>
                <span className="text-2xl font-bold text-orange-700">{highCount}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg border border-amber-100 bg-amber-50">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Medium</span>
                <span className="text-2xl font-bold text-amber-700">{mediumCount}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low</span>
                <span className="text-2xl font-bold text-slate-700">{lowCount}</span>
              </div>
            </div>
          </div>

          {/* Urgent Tasks */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Urgent Tasks</h2>
              <button 
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                onClick={() => navigate('/tasks')}
              >
                View all tasks
              </button>
            </div>
            
            <div className="flex flex-col">
              {urgentTasks.length > 0 ? (
                urgentTasks.map((task, idx) => {
                  const assignedUser = users.find(u => u.user_id === task.assigned_to);
                  return (
                    <div 
                      key={task.task_id} 
                      className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${idx !== urgentTasks.length - 1 ? 'border-b border-slate-100' : ''}`}
                      onClick={() => navigate(`/tasks/${task.task_id}`)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{task.title}</span>
                        <span className="text-xs text-slate-500">
                          {assignedUser ? assignedUser.name : 'Unassigned'} • {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()} Priority
                        </span>
                      </div>
                      <div>{getStatusDisplay(task.status)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">No pending tasks found.</div>
              )}
            </div>
          </div>

        </div>
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

export default Dashboard;
