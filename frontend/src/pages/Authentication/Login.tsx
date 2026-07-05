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
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Image with Dark Navy Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 transform scale-[1.01]"
        style={{ backgroundImage: `url('/hero-login.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/75 to-slate-950/70" />

      {/* Login Card Container (Centered) */}
      <div className="relative z-10 w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl shadow-slate-950/50">
        <div className="flex flex-col items-center">
          <img src="/dana-logo.svg" className="h-14 w-auto mb-4" alt="DANA Logo" />
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            Sign In to DIBMS
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-semibold tracking-wide">
            Dana India Branch Management System
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-3 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-slate-50/50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all bg-slate-50/50 focus:bg-white text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
            Demo Logins
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Quick Login Buttons */}
        <div className="space-y-2.5 text-xs">
          <button
            type="button"
            onClick={() => fillCredentials('admin@dana-demo.com', 'Admin@123')}
            className="w-full p-3 border border-slate-100 hover:border-blue-100 bg-slate-50/40 rounded-xl text-left hover:bg-blue-50/30 transition-all flex justify-between items-center group cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Enterprise Admin (Head Office)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">admin@dana-demo.com</p>
            </div>
            <span className="text-[10px] bg-slate-100 group-hover:bg-blue-100/50 px-2 py-0.5 rounded font-semibold text-slate-500 group-hover:text-blue-700 transition-all">
              Admin@123
            </span>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('manager.pune@dana-demo.com', 'Manager@123')}
            className="w-full p-3 border border-slate-100 hover:border-blue-100 bg-slate-50/40 rounded-xl text-left hover:bg-blue-50/30 transition-all flex justify-between items-center group cursor-pointer"
          >
            <div>
              <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Plant Manager (Pune)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">manager.pune@dana-demo.com</p>
            </div>
            <span className="text-[10px] bg-slate-100 group-hover:bg-blue-100/50 px-2 py-0.5 rounded font-semibold text-slate-500 group-hover:text-blue-700 transition-all">
              Manager@123
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
