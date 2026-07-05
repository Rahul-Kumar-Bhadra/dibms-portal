import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { safeDate } from '../../utils/date';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Megaphone,
  Info,
  X,
  Plus
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Enterprise Admin';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    type: 'announcement'
  });

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notifications list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map((n) => api.post(`/notifications/${n.id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.title || !announcement.message) {
      alert('Please fill in title and message.');
      return;
    }

    try {
      await api.post('/notifications/announcement', announcement);
      setShowBroadcastModal(false);
      setAnnouncement({ title: '', message: '', type: 'announcement' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert('Failed to send announcement.');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className="p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'announcement':
        return (
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl border border-amber-100 shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100 shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Control Alerts & Announcements
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Review audit alerts and post system broadcasts to branches.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleMarkAllRead}
            disabled={notifications.filter((n) => !n.is_read).length === 0}
            className="enterprise-btn-secondary flex items-center disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="enterprise-btn-primary flex items-center shadow-md shadow-slate-950/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Broadcast Notice
            </button>
          )}
        </div>
      </div>

      {/* Notifications listing */}
      {loading ? (
        <div className="flex py-20 justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-100 shadow-sm text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Inbox is empty</p>
          <p className="text-xs text-slate-400 mt-1">You will receive system alerts here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start space-x-4 transition-colors hover:bg-slate-50/50 ${
                !n.is_read ? 'bg-blue-50/10' : ''
              }`}
            >
              {getNotifIcon(n.type)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold text-slate-800 ${!n.is_read ? 'font-black' : ''}`}>
                    {n.title}
                  </h4>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {safeDate(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{n.message}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold ml-4 cursor-pointer"
                >
                  Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADMIN BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Broadcast Notice Announcement</h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAnnouncement} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Compliance Audit"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Notification Type</label>
                <select
                  value={announcement.type}
                  onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                >
                  <option value="announcement">Announcement Notice</option>
                  <option value="alert">Critical Security Alert</option>
                  <option value="info">General Info Bulletin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Notice message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type broadcast message details to send to all branch managers..."
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enterprise-btn-primary"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
