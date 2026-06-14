import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Task, Project, User } from '../types';

// Use local JSON data as fallback/mock
import tasksData from '../data/tasks.json';
import projectsData from '../data/projects.json';
import usersData from '../data/users.json';

interface DataContextType {
  tasks: Task[];
  projects: Project[];
  users: User[];
  loading: boolean;
  addTask: (task: Omit<Task, 'task_id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskIndex: number) => void;
  updateSubtask: (taskId: string, subtaskIndex: number, newTitle: string) => void;
  deleteSubtask: (taskId: string, subtaskIndex: number) => void;
  addSubtasksToTask: (taskId: string, titles: string[]) => void;
  reorderProjects: (startIndex: number, endIndex: number) => void;
  addProject: (name: string, deadline?: string) => string;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  getOrCreateProjectByName: (name: string) => string;
  getOrCreateUserByName: (name: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data with localStorage persistence for tasks
    const loadData = () => {
      const cachedTasks = localStorage.getItem('tasksync_tasks');
      if (cachedTasks) {
        try {
          setTasks(JSON.parse(cachedTasks));
        } catch (e) {
          setTasks(tasksData as Task[]);
        }
      } else {
        setTasks(tasksData as Task[]);
        localStorage.setItem('tasksync_tasks', JSON.stringify(tasksData));
      }

      const cachedProjects = localStorage.getItem('tasksync_projects');
      if (cachedProjects) {
        try {
          setProjects(JSON.parse(cachedProjects));
        } catch (e) {
          setProjects(projectsData as Project[]);
        }
      } else {
        setProjects(projectsData as Project[]);
        localStorage.setItem('tasksync_projects', JSON.stringify(projectsData));
      }

      setUsers(usersData as User[]);
      setLoading(false);
    };

    loadData();
  }, []);

  const addTask = (newTaskData: Omit<Task, 'task_id'>) => {
    const newId = `tk-${String(tasks.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    const newTask: Task = {
      ...newTaskData,
      task_id: newId,
      status: newTaskData.status || 'TODO',
      priority: newTaskData.priority || 'MEDIUM',
      assigned_to: newTaskData.assigned_to || 'u001',
      subtasks: newTaskData.subtasks || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTasks(prev => {
      const updated = [newTask, ...prev];
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.task_id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.task_id !== taskId);
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSubtask = (taskId: string, subtaskIndex: number) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.task_id === taskId && t.subtasks) {
          const updatedSubtasks = [...t.subtasks];
          updatedSubtasks[subtaskIndex] = {
            ...updatedSubtasks[subtaskIndex],
            completed: !updatedSubtasks[subtaskIndex].completed
          };
          return { ...t, subtasks: updatedSubtasks, updated_at: new Date().toISOString() };
        }
        return t;
      });
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const addSubtasksToTask = (taskId: string, titles: string[]) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.task_id === taskId) {
          const newSubtasks = titles.map(title => ({ title, completed: false }));
          const currentSubtasks = t.subtasks || [];
          return { ...t, subtasks: [...currentSubtasks, ...newSubtasks], updated_at: new Date().toISOString() };
        }
        return t;
      });
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const updateSubtask = (taskId: string, subtaskIndex: number, newTitle: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.task_id === taskId && t.subtasks) {
          const updatedSubtasks = [...t.subtasks];
          updatedSubtasks[subtaskIndex] = {
            ...updatedSubtasks[subtaskIndex],
            title: newTitle
          };
          return { ...t, subtasks: updatedSubtasks, updated_at: new Date().toISOString() };
        }
        return t;
      });
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSubtask = (taskId: string, subtaskIndex: number) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.task_id === taskId && t.subtasks) {
          const updatedSubtasks = t.subtasks.filter((_, idx) => idx !== subtaskIndex);
          return { ...t, subtasks: updatedSubtasks, updated_at: new Date().toISOString() };
        }
        return t;
      });
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const reorderProjects = (startIndex: number, endIndex: number) => {
    setProjects(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      localStorage.setItem('tasksync_projects', JSON.stringify(result));
      return result;
    });
  };

  const addProject = (name: string, deadline?: string) => {
    const newId = `pj-${Date.now().toString().slice(-6)}`;
    const newProject: Project = {
      project_id: newId,
      name,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    setProjects(prev => {
      const updated = [...prev, newProject];
      localStorage.setItem('tasksync_projects', JSON.stringify(updated));
      return updated;
    });
    return newId;
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.project_id === projectId ? { ...p, ...updates } : p);
      localStorage.setItem('tasksync_projects', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteProject = (projectId: string) => {
    // Delete project
    setProjects(prev => {
      const updated = prev.filter(p => p.project_id !== projectId);
      localStorage.setItem('tasksync_projects', JSON.stringify(updated));
      return updated;
    });
    // Also delete all tasks associated with this project
    setTasks(prev => {
      const updated = prev.filter(t => t.project_id !== projectId);
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const getOrCreateProjectByName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return '';
    const existing = projects.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) return existing.project_id;
    return addProject(trimmedName);
  };

  const getOrCreateUserByName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return '';
    const existing = users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) return existing.user_id;
    
    const newId = `u-${Date.now().toString().slice(-4)}`;
    const newUser: User = {
      user_id: newId,
      name: trimmedName,
      email: `${trimmedName.replace(/\s+/g, '').toLowerCase()}@example.com`,
      phone: '',
      loyalty_points: 0,
      role: 'MEMBER'
    };
    setUsers(prev => [...prev, newUser]);
    return newId;
  };

  return (
    <DataContext.Provider value={{ 
      tasks, 
      projects, 
      users, 
      loading,
      addTask,
      updateTask,
      deleteTask,
      toggleSubtask,
      updateSubtask,
      deleteSubtask,
      addSubtasksToTask,
      reorderProjects,
      addProject,
      updateProject,
      deleteProject,
      getOrCreateProjectByName,
      getOrCreateUserByName
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
