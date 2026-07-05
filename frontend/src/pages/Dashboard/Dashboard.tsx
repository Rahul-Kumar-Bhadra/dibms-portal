import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/cards/StatCard';
import { safeDate } from '../../utils/date';
import {
  Building2,
  Users,
  FileCheck,
  FileWarning,
  IndianRupee,
  Hammer,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatINR = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(value / 100000).toFixed(1)} L`;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Enterprise Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/branch';
        const res = await api.get(endpoint);
        setStats(res.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch dashboard metrics. Please reload.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
          <p className="font-semibold">{error || 'An error occurred.'}</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#ea580c', '#3b82f6'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Welcome back, {user?.first_name || 'User'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Here is the operational overview for {isAdmin ? 'all India plant locations' : `${user?.plant_name} plant`}.
          </p>
        </div>
        {!isAdmin && stats.pending_reports > 0 && (
          <div className="mt-4 md:mt-0">
            <Link
              to="/operations-reports"
              className="enterprise-btn-primary bg-amber-600 hover:bg-amber-700 flex items-center cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" />
              Submit {stats.pending_month_name} Report
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Plants"
            value={stats.total_plants}
            icon={Building2}
            description="Active across India"
          />
          <StatCard
            title="Total Workforce"
            value={stats.total_employees}
            icon={Users}
            description="Onboarded personnel"
          />
          <StatCard
            title="Aggregated Revenue"
            value={formatINR(stats.total_revenue)}
            icon={IndianRupee}
            change="+8.4%"
            changeType="positive"
            description="Across all months"
          />
          <StatCard
            title="Production Output"
            value={stats.total_production.toLocaleString()}
            icon={Hammer}
            description="Total units manufactured"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Staff Strength"
            value={stats.total_employees}
            icon={Users}
            description="Active workforce"
          />
          <StatCard
            title="Submitted Reports"
            value={stats.reports_submitted}
            icon={FileCheck}
            description="Monthly submissions"
          />
          <StatCard
            title="Pending Reports"
            value={stats.pending_reports}
            icon={FileWarning}
            change={stats.pending_reports > 0 ? "Action Required" : "Up to Date"}
            changeType={stats.pending_reports > 0 ? "negative" : "positive"}
            description="Requires attention"
          />
          <StatCard
            title="Latest Monthly Revenue"
            value={formatINR(stats.monthly_revenue)}
            icon={IndianRupee}
            description="For latest period"
          />
        </div>
      )}

      {/* Charts Panel */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue & Expense Trend Chart */}
          <div className="enterprise-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Financial Trends ({stats.pending_year})
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip formatter={(value: any) => formatINR(value)} labelStyle={{ fontSize: 12 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution (Pie) */}
          <div className="enterprise-card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Workforce Allocation</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.employee_distribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.employee_distribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip labelStyle={{ fontSize: 12 }} />
                  <Legend verticalAlign="bottom" iconType="rect" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tables/Lists Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left/Main Column - Activities */}
        <div className="enterprise-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Control Logs</h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-slate-100">
              {stats.recent_activities.length === 0 ? (
                <li className="py-5 text-center text-xs text-slate-400">No recent activity</li>
              ) : (
                stats.recent_activities.map((act: any) => (
                  <li key={act.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {act.action}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{act.details}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-medium">
                        {act.user && <span className="block text-slate-500 font-semibold mb-0.5">{act.user}</span>}
                        {safeDate(act.time || act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Right Column - Secondary list depending on role */}
        <div className="enterprise-card p-5">
          {isAdmin ? (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center justify-between">
                <span>Pending Submissions</span>
                <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded-md font-bold">
                  {stats.pending_month_name} {stats.pending_year}
                </span>
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {stats.pending_reports_list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-800">All submissions in</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nice job! All plants have reported.</p>
                  </div>
                ) : (
                  stats.pending_reports_list.map((plant: any) => (
                    <div
                      key={plant.plant_id}
                      className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">{plant.plant_name}</h4>
                        <span className="text-[10px] text-slate-400">{plant.state}</span>
                      </div>
                      <a
                        href={`mailto:${plant.contact}?subject=DMEOP: Pending Operations Report Submission ${stats.pending_month_name} ${stats.pending_year}`}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                      >
                        Remind Manager
                      </a>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Plant Performance Details</h3>
              <div className="space-y-4">
                <div className="p-3 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium">Average Attendance Rate</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-slate-800">{stats.average_attendance}%</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      On Target
                    </span>
                  </div>
                </div>
                
                <div className="p-3 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-medium">Monthly Audit Status</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-slate-800">Compliance score</span>
                    <span className="text-[10px] text-slate-500 font-bold">100% Verified</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
