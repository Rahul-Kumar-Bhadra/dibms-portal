import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileBarChart,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const adminLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plants', label: 'Plant Directory', icon: Building2 },
    { to: '/workforce', label: 'Workforce', icon: Users },
    { to: '/operations-reports', label: 'Operations Reports', icon: FileBarChart },
    { to: '/documents', label: 'Technical Docs', icon: FolderOpen },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/audit', label: 'Audit Logs', icon: ShieldAlert },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const managerLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/workforce', label: 'Workforce', icon: Users },
    { to: '/operations-reports', label: 'Operations Reports', icon: FileBarChart },
    { to: '/documents', label: 'Technical Docs', icon: FolderOpen },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const links = role === 'Enterprise Admin' ? adminLinks : managerLinks;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-sidebar text-slate-200 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <img src="/dana-logo.svg" className="h-7 w-auto" alt="DANA Logo" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">DMEOP</h1>
            <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">
              Plant Operations
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="px-3 mb-6">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <h2 className="text-sm font-semibold text-white truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
            </h2>
            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {user?.role}
            </span>
            {user?.plant_name && (
              <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                Plant: {user.plant_name}
              </p>
            )}
          </div>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
              >
                <Icon className="w-4 h-4 mr-3" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
