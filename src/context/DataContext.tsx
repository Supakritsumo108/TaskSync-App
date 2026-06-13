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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const loadData = () => {
      setTasks(tasksData as Task[]);
      setProjects(projectsData as Project[]);
      setUsers(usersData as User[]);
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ tasks, projects, users, loading }}>
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
