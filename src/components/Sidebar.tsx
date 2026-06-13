
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, LogOut, Kanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 fixed h-screen z-50">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 shrink-0"></div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">TaskSync</h2>
        </div>
      </div>
      
      <nav className="flex flex-col gap-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/board" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <Kanban size={20} />
          <span>Board</span>
        </NavLink>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
