import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Trash2, Edit, CheckCircle2, Clock, User as UserIcon, MessageSquare, Sparkles, AlignLeft, Send, ChevronDown } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TaskModal from '../components/TaskModal';
import Swal from 'sweetalert2';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, projects, users, loading, updateTask, toggleSubtask, deleteTask, addSubtasksToTask, addCommentToTask } = useData();
  const { currentUser } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const task = tasks.find(t => t.task_id === id);

  // Sync descText when task changes
  useEffect(() => {
    if (task) {
      setDescText(task.description || '');
    }
  }, [task?.description]);

  // Handle outside click for status menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="text-slate-500 p-8 flex justify-center">Loading task details...</div>;

  if (!task) {
    return (
      <div className="p-8 text-slate-500 flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <button className="text-indigo-600 font-medium hover:underline cursor-pointer" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </button>
      </div>
    );
  }

  const project = projects.find(p => p.project_id === task.project_id);
  const assignedUser = users.find(u => u.user_id === task.assigned_to);

  const handleStatusChange = (newStatus: 'TODO' | 'DOING' | 'DONE' | 'BLOCKED') => {
    updateTask(task.task_id, { status: newStatus });
    setIsStatusMenuOpen(false);
    Swal.fire({
      toast: true, position: 'top-end', icon: 'success', title: 'Status updated', showConfirmButton: false, timer: 2000
    });
  };

  const handleUpdateTask = (taskData: any) => {
    updateTask(task.task_id, taskData);
    setIsEditModalOpen(false);
    Swal.fire({
      toast: true, position: 'top-end', icon: 'success', title: 'Task updated', showConfirmButton: false, timer: 3000
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#f43f5e', cancelButtonColor: '#94a3b8', confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteTask(task.task_id);
        navigate('/tasks');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 2000 });
      }
    });
  };

  const handleSaveDescription = () => {
    updateTask(task.task_id, { description: descText });
    setIsEditingDesc(false);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Description saved', showConfirmButton: false, timer: 2000 });
  };

  const handlePostComment = () => {
    if (!commentInput.trim()) return;
    const userId = currentUser?.uid || assignedUser?.user_id || 'u001';
    addCommentToTask(task.task_id, commentInput.trim(), userId);
    setCommentInput('');
  };

  const handleAIBreakdown = async () => {
    if (!task) return;
    try {
      setIsAILoading(true);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "dummy-key") {
        setTimeout(() => {
          addSubtasksToTask(task.task_id, ["Research the topic thoroughly", "Create initial draft", "Review and revise", "Final submission"]);
          setIsAILoading(false);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'AI Breakdown Generated (Demo)', showConfirmButton: false, timer: 3000 });
        }, 1500);
        return;
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
      const prompt = `Act as a productivity expert. Break down the following task into 3-5 actionable subtasks. Task Title: "${task.title}". Task Project: "${project?.name || 'None'}". Respond ONLY with a valid JSON array of strings representing the subtask titles in Thai language. Example: ["วิเคราะห์ข้อมูล", "ออกแบบหน้าจอ"]`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      let parsedSubtasks: string[] = [];
      try { parsedSubtasks = JSON.parse(responseText); } catch (e) { throw new Error("Failed to parse AI response"); }
      if (Array.isArray(parsedSubtasks) && parsedSubtasks.length > 0) {
        addSubtasksToTask(task.task_id, parsedSubtasks);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '✨ AI Breakdown generated!', showConfirmButton: false, timer: 3000 });
      }
    } catch (error: any) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Oops...', text: error.message || 'Failed to generate AI breakdown' });
    } finally {
      setIsAILoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'TODO': return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'To Do' };
      case 'DOING': return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' };
      case 'DONE': return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completed' };
      case 'BLOCKED': return { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Blocked' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'To Do' };
    }
  };

  const currentStatusConfig = getStatusConfig(task.status);
  const completedSubtasksCount = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;
  const subtasksProgress = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  const getUserInitials = (user?: any) => {
    if (!user || !user.name) return 'U';
    return user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-300 pb-32">
      
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
            Edit
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Context */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()} Priority
                </span>
                {project && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold">
                    Project: {project.name}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{task.title}</h1>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <AlignLeft size={18} className="text-indigo-600" />
                Description
              </h3>
              
              {isEditingDesc ? (
                <div className="flex flex-col gap-3">
                  <textarea 
                    className="w-full min-h-[150px] p-3 text-sm text-slate-700 bg-slate-50 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    placeholder="Add more details to this task..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2 self-end">
                    <button 
                      onClick={() => { setIsEditingDesc(false); setDescText(task.description || ''); }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveDescription}
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingDesc(true)}
                  className={`p-4 rounded-xl text-sm transition-colors cursor-pointer border ${task.description ? 'bg-slate-50 border-transparent hover:bg-slate-100' : 'bg-white border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500'}`}
                >
                  {task.description ? (
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{task.description}</p>
                  ) : (
                    <span className="flex items-center justify-center gap-2 py-4">
                      <Edit size={16} /> Click to add description...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtasks Component */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-indigo-600" />
                  Subtasks
                </h3>
                {totalSubtasksCount > 0 && (
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {completedSubtasksCount} / {totalSubtasksCount}
                  </span>
                )}
              </div>
              {totalSubtasksCount > 0 && (
                <button 
                  onClick={handleAIBreakdown}
                  disabled={isAILoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAILoading ? (
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles size={14} />
                  )}
                  AI Breakdown
                </button>
              )}
            </div>

            {totalSubtasksCount > 0 ? (
              <>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500" 
                    style={{ width: `${subtasksProgress}%` }}
                  />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {task.subtasks?.map((sub, idx) => (
                    <label 
                      key={idx} 
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${sub.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4.5 h-4.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        checked={sub.completed}
                        onChange={() => toggleSubtask(task.task_id, idx)}
                      />
                      <span className={`text-sm font-medium leading-tight ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {sub.title}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Break this down into pieces</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                  Let our AI analyze this task and instantly generate a checklist.
                </p>
                <button 
                  onClick={handleAIBreakdown}
                  disabled={isAILoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAILoading ? (
                    <><div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div> Generating...</>
                  ) : (
                    <><Sparkles size={16} /> ✨ AI Auto-Breakdown</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Status, Meta, Comments) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">Details</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 relative" ref={statusMenuRef}>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> STATUS
                </span>
                <button 
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className={`flex items-center justify-between w-full p-3 rounded-lg font-bold text-sm cursor-pointer transition-colors ${currentStatusConfig.bg} ${currentStatusConfig.text}`}
                >
                  {currentStatusConfig.label}
                  <ChevronDown size={16} className={`transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isStatusMenuOpen && (
                  <div className="absolute top-[60px] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-10 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {['TODO', 'DOING', 'DONE', 'BLOCKED'].map(s => {
                      const c = getStatusConfig(s);
                      return (
                        <button 
                          key={s}
                          onClick={() => handleStatusChange(s as any)}
                          className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg cursor-pointer transition-colors ${task.status === s ? c.bg + ' ' + c.text : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <UserIcon size={14} /> ASSIGNEE
                </span>
                <div className="flex items-center gap-3 mt-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {getUserInitials(assignedUser)}
                  </div>
                  <span className="text-sm font-bold text-slate-800 truncate">{assignedUser ? assignedUser.name : 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Clock size={14} /> DUE DATE
                </span>
                <span className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {project?.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare size={16} className="text-indigo-600" />
              Activity & Comments
            </h3>
            
            <div className="flex flex-col gap-5 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {(!task.comments || task.comments.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                task.comments.map(comment => {
                  const commentUser = users.find(u => u.user_id === comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-slate-200">
                        {getUserInitials(commentUser)}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-800">{commentUser ? commentUser.name : 'You'}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-tr-xl rounded-b-xl border border-slate-200 mt-1 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Input box */}
            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Ask a question or post an update..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all text-slate-800"
                />
                <button 
                  onClick={handlePostComment}
                  disabled={!commentInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
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
