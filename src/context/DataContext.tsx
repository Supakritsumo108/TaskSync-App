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
  addTask: (task: Omit<Task, 'task_id'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskIndex: number) => void;
  addSubtasksToTask: (taskId: string, titles: string[]) => void;
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
      setProjects(projectsData as Project[]);
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
      subtasks: newTaskData.subtasks || []
    };

    setTasks(prev => {
      const updated = [newTask, ...prev];
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.task_id === taskId ? { ...t, ...updates } : t);
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
          return { ...t, subtasks: updatedSubtasks };
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
          return { ...t, subtasks: [...currentSubtasks, ...newSubtasks] };
        }
        return t;
      });
      localStorage.setItem('tasksync_tasks', JSON.stringify(updated));
      return updated;
    });
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
      addSubtasksToTask
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
