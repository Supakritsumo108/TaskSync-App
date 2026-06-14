import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Project } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  initialData?: Project;
}

const ProjectModal = ({ isOpen, onClose, onSubmit, initialData }: ProjectModalProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDeadline(initialData.deadline ? initialData.deadline.substring(0, 10) : '');
    } else {
      setName('');
      setDeadline('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name,
      ...(deadline ? { deadline: new Date(deadline).toISOString() } : { deadline: undefined })
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{initialData ? t('projects.edit') : t('modal.createProject')}</h2>
          <button className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('modal.projectName')}</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder={t('placeholder.projectNameInput')}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">{t('projects.due')}</label>
              <input 
                type="date"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" className="px-4 py-2 rounded-md font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-sm" onClick={onClose}>{t('modal.cancel')}</button>
            <button type="submit" className={`px-4 py-2 rounded-md font-medium text-white transition-colors cursor-pointer text-sm ${initialData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {initialData ? t('modal.save') : t('modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
