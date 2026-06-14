import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Project, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  initialData?: Task;
  defaultProjectName?: string;
  projects: Project[];
  users: User[];
}

const TaskModal = ({ isOpen, onClose, onSubmit, initialData, defaultProjectName, projects, users }: TaskModalProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.project_id || '');
  const [assignedTo, setAssignedTo] = useState(users[0]?.user_id || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [status, setStatus] = useState<'TODO' | 'DOING' | 'DONE' | 'BLOCKED'>('TODO');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      
      const pName = projects.find(p => p.project_id === initialData.project_id)?.name || initialData.project_id;
      setProjectId(pName);
      
      const uName = users.find(u => u.user_id === initialData.assigned_to)?.name || initialData.assigned_to;
      setAssignedTo(uName);
      
      setDueDate(initialData.due_date || '');
      setPriority(initialData.priority);
      setStatus(initialData.status);
    } else {
      setTitle('');
      setProjectId(defaultProjectName || '');
      setAssignedTo('');
      setDueDate('');
      setPriority('MEDIUM');
      setStatus('TODO');
    }
  }, [initialData, projects, users, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      project_id: projectId,
      assigned_to: assignedTo,
      due_date: dueDate || undefined,
      priority,
      status
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{initialData ? t('modal.editTask') : t('modal.createTask')}</h2>
          <button className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('modal.title')}</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder={t('placeholder.taskName')}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('modal.project')}</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  value={projectId} 
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder={t('placeholder.projectName')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('modal.assignee')}</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  value={assignedTo} 
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder={t('placeholder.assigneeName')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('task.dueDate')}</label>
              <input 
                type="date"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('modal.priority')}</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[length:14px]" 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="LOW">{t('priority.low')}</option>
                  <option value="MEDIUM">{t('priority.medium')}</option>
                  <option value="HIGH">{t('priority.high')}</option>
                  <option value="CRITICAL">{t('priority.critical')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">{t('modal.status')}</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[length:14px]" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="TODO">{t('status.todo')}</option>
                  <option value="DOING">{t('status.doing')}</option>
                  <option value="DONE">{t('status.done')}</option>
                  <option value="BLOCKED">{t('status.blocked')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              {t('modal.cancel')}
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer">
              {initialData ? t('modal.save') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
