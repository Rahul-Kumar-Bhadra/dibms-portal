import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Settings as SettingsIcon,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2 text-blue-600" />
          Account & Operations Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Manage your personal profile and security configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="enterprise-card p-5 md:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20 mb-3">
              {user?.first_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {user?.role}
            </span>
          </div>

          <div className="pt-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Email</span>
              <span className="text-slate-700 font-semibold truncate max-w-[140px]" title={user?.email}>
                {user?.email}
              </span>
            </div>
            {user?.plant_name && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Plant</span>
                <span className="text-slate-700 font-semibold">{user.plant_name}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Plant Code/ID</span>
              <span className="text-slate-700 font-semibold">{user?.plant_id || 'HQ Operations'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="enterprise-card p-5 md:col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-slate-500" />
            Security settings: Update Password
          </h3>

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Type current password"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="enterprise-btn-primary"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
