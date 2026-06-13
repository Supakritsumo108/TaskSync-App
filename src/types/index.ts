export interface Project {
  project_id: string;
  name: string;
  deadline: string;
}

export interface Task {
  task_id: string;
  project_id: string;
  assigned_to: string;
  title: string;
  status: 'TODO' | 'DOING' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  subtasks?: { title: string; completed: boolean }[];
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  role: 'MEMBER' | 'VIP';
}
