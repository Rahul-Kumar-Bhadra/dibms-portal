import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Menu,
  Bell,
  LogOut,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for alerts
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      // Update locally
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between glass-header px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-slate-500 hover:text-slate-700 md:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-slate-800 hidden md:inline">
          {user?.role === 'Enterprise Admin' ? 'Enterprise HQ Operations Center' : `${user?.plant_name || 'Plant'} Dashboard`}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl bg-white border border-slate-100 shadow-lg ring-1 ring-black/5 z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-slate-50/50 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {n.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-xs text-slate-800">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View all in inbox
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-500/20">
              {user?.first_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
              </p>
              <p className="text-[9px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                {user?.role}
              </p>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2.5 w-48 rounded-xl bg-white border border-slate-100 shadow-lg ring-1 ring-black/5 z-50 py-1">
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-xs text-slate-400 font-medium">Logged in email</p>
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 mr-2 text-slate-400" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 mr-2 text-red-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
