import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import TaskModal from "../components/TaskModal";
import Swal from "sweetalert2";
import { ListTodo, Plus, Search, FolderGit2, TrendingUp, Bell, ArrowUpDown } from "lucide-react";

ChartJS.register(ArcElement, Tooltip);

const Dashboard = () => {
  const { tasks, users, projects, loading: dataLoading, addTask, getOrCreateProjectByName, getOrCreateUserByName } = useData();
  const { userProfile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dueTasks, setDueTasks] = useState<any[]>([]);

  // Notification simulation based on real data
  useEffect(() => {
    if (tasks.length > 0) {
      const now = new Date();
      const soon = new Date();
      soon.setDate(now.getDate() + 2);
      
      const dueSoonTasks = tasks.filter(t => {
        if (t.status === 'DONE') return false;
        const project = projects.find(p => p.project_id === t.project_id);
        const effectiveDueDate = t.due_date || project?.deadline;
        if (!effectiveDueDate) return false;
        const dueDate = new Date(effectiveDueDate);
        return dueDate >= now && dueDate <= soon;
      });

      setDueTasks(dueSoonTasks);

      const notifyDueStr = localStorage.getItem("tasksync_notifyDue");
      const notifyDue = notifyDueStr === null ? true : notifyDueStr === "true";

      if (notifyDue && dueSoonTasks.length > 0) {
        const firstDue = dueSoonTasks[0];
        // Prevent showing the same notification repeatedly in this session
        if (!sessionStorage.getItem(`notified_task_${firstDue.task_id}`)) {
          setTimeout(() => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'warning',
              title: language === 'th' ? 'งานใกล้ถึงกำหนด!' : 'Task Due Soon!',
              text: `${firstDue.title}`,
              showConfirmButton: false,
              timer: 5000
            });
            sessionStorage.setItem(`notified_task_${firstDue.task_id}`, 'true');
          }, 2000);
        }
      }
    }
  }, [tasks, language]);


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<'UPDATED' | 'NEWEST' | 'OLDEST'>('UPDATED');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  if (dataLoading)
    return (
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
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32"
            >
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

  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const doingCount = tasks.filter((t) => t.status === "DOING").length;
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const totalCount = tasks.length;
  const totalProjects = projects.length;

  const doughnutData = {
    labels: [
      t("status.done"),
      t("status.doing"),
      t("status.todo"),
      t("status.blocked"),
    ],
    datasets: [
      {
        data: [doneCount, doingCount, todoCount, blockedCount],
        backgroundColor: ["#10B981", "#F59E0B", "#E2E8F0", "#EF4444"], // Emerald, Amber, Slate, Red
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "ALL" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    // If timestamps are missing, fallback to 0
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    const createA = new Date(a.created_at || 0).getTime();
    const createB = new Date(b.created_at || 0).getTime();
    
    if (sortBy === 'UPDATED') return timeB - timeA; // Descending (latest updated first)
    if (sortBy === 'NEWEST') return createB - createA; // Descending (latest created first)
    if (sortBy === 'OLDEST') return createA - createB; // Ascending (oldest created first)
    return 0;
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
      items.push(2, 3, 4, 5, "...");
    } else if (current >= total - 3) {
      items.push("...", total - 4, total - 3, total - 2, total - 1);
    } else {
      items.push("...", current - 1, current, current + 1, "...");
    }
    items.push(total);
    return items;
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "DONE":
        return (
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            {t("status.done")}
          </span>
        );
      case "DOING":
        return (
          <span className="bg-amber-50 text-amber-600 border border-amber-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            {t("status.doing")}
          </span>
        );
      case "TODO":
        return (
          <span className="bg-slate-50 text-slate-600 border border-slate-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            {t("status.todo")}
          </span>
        );
      case "BLOCKED":
        return (
          <span className="bg-red-50 text-red-600 border border-red-200/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            {t("status.blocked")}
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="text-red-600 font-black tracking-wide text-xs bg-red-50 px-2 py-0.5 rounded border border-red-100">
            {t("priority.critical")}
          </span>
        );
      case "HIGH":
        return (
          <span className="text-orange-500 font-bold tracking-wide text-xs bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
            {t("priority.high")}
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-amber-500 font-bold tracking-wide text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
            {t("priority.medium")}
          </span>
        );
      case "LOW":
        return (
          <span className="text-slate-400 font-bold tracking-wide text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {t("priority.low")}
          </span>
        );
      default:
        return priority;
    }
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

    addTask(finalTaskData as any);
    setIsModalOpen(false);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: t("alert.createSuccess"),
      showConfirmButton: false,
      timer: 3000,
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 w-full">
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full pb-16 pt-8 px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between mt-4 gap-4">
          {/* Left: Avatar + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg shrink-0">
              {userProfile?.displayName
                ? userProfile.displayName.substring(0, 1).toUpperCase()
                : "U"}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                {t("dashboard.title")}
              </h1>
              <p className="text-slate-500 text-xs sm:text-base truncate">{t("dashboard.subtitle")}</p>
            </div>
          </div>

          {/* Right: Bell + Date */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
              >
                <Bell size={20} />
                {dueTasks.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
                )}
              </button>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute top-11 right-0 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800">{language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</h3>
                      {dueTasks.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          {dueTasks.length} {language === 'th' ? 'ใหม่' : 'New'}
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {dueTasks.length > 0 ? (
                        <div className="flex flex-col">
                          {dueTasks.map(task => (
                            <div key={task.task_id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setIsNotifOpen(false); navigate(`/tasks/${task.task_id}`); }}>
                              <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><Bell size={13} /></div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{task.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{language === 'th' ? 'ครบกำหนด:' : 'Due:'} {new Date((task.due_date || projects.find(p => p.project_id === task.project_id)?.deadline) as string).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <Bell size={20} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500 text-sm">{language === 'th' ? 'ไม่มีการแจ้งเตือนใหม่' : 'No new notifications'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Date — desktop only */}
            <div className="hidden sm:block text-right border-l border-slate-200 pl-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {format(new Date(), "EEEE", { locale: language === "th" ? th : undefined })}
              </p>
              <p className="text-xl font-bold text-slate-800">
                {format(new Date(), "dd MMM yyyy", { locale: language === "th" ? th : undefined })}
              </p>
            </div>
          </div>
        </header>

        {/* Top Section: Chart & New KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-8 w-full text-center">
              {t("dashboard.overview")}
            </h2>

            <div className="relative w-44 h-44 mb-8">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  cutout: "75%",
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-slate-900 leading-none mb-1">
                  {totalCount}
                </span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {t("dashboard.totalTasks")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>{t("status.done")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>{t("status.doing")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span>{t("status.todo")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>{t("status.blocked")}</span>
              </div>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
                  {t("dashboard.totalProjects")}
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FolderGit2 size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900">
                {totalProjects}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
                  {t("dashboard.totalTasks")}
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <ListTodo size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900">
                {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List Section */}
        <div className="flex flex-col gap-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={24} />
              {t("dashboard.recentActivity")}
            </h2>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center" onClick={() => { setIsModalOpen(true); }}>
              <Plus size={18} strokeWidth={3} />
              {t("dashboard.newTask")}
            </button>
          </div>

          {/* Filters & Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={t("dashboard.search")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters — 3-col on sm+, 2-col grid on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <select
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer appearance-none"
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
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer appearance-none"
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ArrowUpDown size={15} className="text-slate-400" />
                </div>
                <select
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all cursor-pointer appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em"
                  }}
                >
                  <option value="UPDATED">{t('sort.updated')}</option>
                  <option value="NEWEST">{t('sort.newest')}</option>
                  <option value="OLDEST">{t('sort.oldest')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4 font-bold">{t('table.name')}</th>
                    <th className="p-4 font-bold hidden sm:table-cell">{t('table.assignee')}</th>
                    <th className="p-4 font-bold">{t('table.status')}</th>
                    <th className="p-4 font-bold hidden md:table-cell">{t('table.priority')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {currentTasks.length > 0 ? (
                    currentTasks.map((task) => {
                      const assignedUser = users.find(
                        (u) => u.user_id === task.assigned_to,
                      );
                      return (
                        <tr
                          key={task.task_id}
                          className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => navigate(`/tasks/${task.task_id}`)}
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {task.title}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 hidden sm:table-cell">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                                {assignedUser?.name.charAt(0) || "U"}
                              </div>
                              <span className="text-sm font-semibold text-slate-600">
                                {assignedUser
                                  ? assignedUser.name
                                  : "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            {getStatusDisplay(task.status)}
                          </td>
                          <td className="py-4 px-4 sm:px-6 hidden md:table-cell">
                            {getPriorityDisplay(task.priority)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <img
                            src="/illustrations/empty-tasks.png"
                            alt="No tasks found"
                            className="w-48 h-auto mb-6 opacity-90 drop-shadow-sm mix-blend-multiply"
                          />
                          <h3 className="font-bold text-xl text-slate-800">{t('tasks.noTasksTitle')}</h3>
                          <p className="text-slate-500 mt-2">{t('tasks.noTasksDesc')}</p>
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
                <div className="text-sm text-slate-500 font-medium">
                  {t('tasks.showing').replace('{start}', String(indexOfFirstTask + 1)).replace('{end}', String(Math.min(indexOfLastTask, filteredTasks.length))).replace('{total}', String(filteredTasks.length))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>

                  {getPaginationItems(currentPage, totalPages).map(
                    (item, index) =>
                      item === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex items-center justify-center w-8 h-8 text-slate-400 font-medium"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${item}`}
                          onClick={() => setCurrentPage(item as number)}
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                            currentPage === item
                              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                  )}

                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
