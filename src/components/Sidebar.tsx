import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, LogOut, Settings, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import SettingsModal from "./SettingsModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
      isActive
        ? "bg-indigo-50 text-indigo-600"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col p-6 z-[100]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity duration-200"
          >
            <img
              src="/logo.png"
              alt="TaskSync Logo"
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              TaskSync
            </h2>
          </Link>
          {/* Close button - mobile only */}
          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/" end className={navLinkClass} onClick={onClose}>
            <LayoutDashboard size={20} />
            <span>{t("nav.home")}</span>
          </NavLink>
          <NavLink to="/tasks" className={navLinkClass} onClick={onClose}>
            <CheckSquare size={20} />
            <span>{t("nav.projects")}</span>
          </NavLink>
        </nav>

        <div className="mt-auto flex flex-col">
          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer mb-4"
            onClick={() => {
              setIsSettingsOpen(true);
              onClose();
            }}
          >
            <Settings size={20} />
            <span>{t("nav.settings")}</span>
          </button>

          <div className="pt-6 border-t border-slate-200">
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Modal — rendered OUTSIDE <aside> to avoid stacking context trap */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Sidebar;
