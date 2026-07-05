import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Post to login endpoint
      const res = await api.post('/auth/login', { email, password });
      const { access_token } = res.data;

      // 2. Fetch user profile
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      // 3. Update auth state
      login(access_token, userRes.data);
      
      // 4. Redirect
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100">
        <div className="flex flex-col items-center">
          <img src="/dana-logo.svg" className="h-16 w-auto mb-4" alt="DANA Logo" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            Sign in to DIBMS
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Dana India Branch Management System
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Demo Logins
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <div className="space-y-2 text-xs">
          <button
            type="button"
            onClick={() => fillCredentials('admin@dana-demo.com', 'Admin@123')}
            className="w-full p-2.5 border border-slate-100 rounded-lg text-left hover:bg-slate-50/80 transition-colors flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-slate-700">Enterprise Admin (Head Office)</p>
              <p className="text-[10px] text-slate-400">admin@dana-demo.com</p>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
              Admin@123
            </span>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('manager.pune@dana-demo.com', 'Manager@123')}
            className="w-full p-2.5 border border-slate-100 rounded-lg text-left hover:bg-slate-50/80 transition-colors flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-slate-700">Plant Manager (Pune)</p>
              <p className="text-[10px] text-slate-400">manager.pune@dana-demo.com</p>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
              Manager@123
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
