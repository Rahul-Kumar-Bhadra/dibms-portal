import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Award,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface ReportItem {
  plant_id: string;
  plant_name: string;
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  production_units: number;
  attendance_rate: number;
  safety_incidents: number;
  quality_score: number;
}

const Analytics: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/operations-reports/');
        setReports(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || reports.length === 0) {
    return (
      <div className="p-6">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-center">
          <p className="font-semibold">{error || 'No reports filed yet. Analytics will populate once reports are submitted.'}</p>
        </div>
      </div>
    );
  }

  // 1. Calculate Plant Rankings (Aggregated Averages)
  const plantAggregates: { [key: string]: { name: string; revSum: number; expSum: number; qualitySum: number; safetySum: number; count: number } } = {};
  
  reports.forEach((r) => {
    if (!plantAggregates[r.plant_id]) {
      plantAggregates[r.plant_id] = {
        name: r.plant_name,
        revSum: 0,
        expSum: 0,
        qualitySum: 0,
        safetySum: 0,
        count: 0
      };
    }
    plantAggregates[r.plant_id].revSum += r.revenue;
    plantAggregates[r.plant_id].expSum += r.expenses;
    plantAggregates[r.plant_id].qualitySum += r.quality_score;
    plantAggregates[r.plant_id].safetySum += r.safety_incidents;
    plantAggregates[r.plant_id].count += 1;
  });

  const plantRankings = Object.keys(plantAggregates).map((key) => {
    const agg = plantAggregates[key];
    const avgQuality = agg.qualitySum / agg.count;
    const avgRevenue = agg.revSum / agg.count;
    const profit = avgRevenue - (agg.expSum / agg.count);
    return {
      id: key,
      name: agg.name,
      avgQuality: round(avgQuality, 1),
      avgRevenue: round(avgRevenue, 2),
      profit: round(profit, 2),
      safetyIncidents: agg.safetySum,
    };
  }).sort((a, b) => b.avgQuality - a.avgQuality); // Rank by quality score

  // 2. Prepare timeline trend grouped by month (overall) — use dynamic current year
  const currentYear = new Date().getFullYear();
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timelineSums: { [key: number]: { monthNum: number; month: string; revenue: number; expenses: number; quality: number; count: number } } = {};
  
  reports.forEach((r) => {
    if (r.year === currentYear) {
      if (!timelineSums[r.month]) {
        timelineSums[r.month] = {
          monthNum: r.month,
          month: monthNames[r.month],
          revenue: 0,
          expenses: 0,
          quality: 0,
          count: 0
        };
      }
      timelineSums[r.month].revenue += r.revenue;
      timelineSums[r.month].expenses += r.expenses;
      timelineSums[r.month].quality += r.quality_score;
      timelineSums[r.month].count += 1;
    }
  });

  const timelineData = Object.keys(timelineSums).map((key) => {
    const s = timelineSums[Number(key)];
    return {
      month: s.month,
      revenue: round(s.revenue, 2),
      expenses: round(s.expenses, 2),
      quality: round(s.quality / s.count, 1)
    };
  });

  // Helper rounded math
  function round(val: number, decimals: number) {
    return Number(val.toFixed(decimals));
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Interactive Performance Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          DMEOP enterprise Business Intelligence tool. Filter and review plant operational metrics.
        </p>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="enterprise-card p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Top Quality Leader</span>
          {plantRankings.length > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">{plantRankings[0].name}</h3>
                <span className="text-2xl font-bold text-blue-600 mt-1 block">
                  {plantRankings[0].avgQuality}%
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Award className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>

        <div className="enterprise-card p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Average Profit Margin</span>
          {plantRankings.length > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Aggregated Margin</h3>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                  {((plantRankings.reduce((acc, b) => acc + b.profit, 0) / plantRankings.reduce((acc, b) => acc + b.avgRevenue, 0)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          )}
        </div>

        <div className="enterprise-card p-5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Safety Incidents</span>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">All India Plants</h3>
              <span className="text-2xl font-bold text-rose-500 mt-1 block">
                {plantRankings.reduce((acc, b) => acc + b.safetyIncidents, 0)}
              </span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Chart Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plant Quality score ranking */}
        <div className="enterprise-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Quality Score Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantRankings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[80, 100]} />
                <Tooltip />
                <Bar dataKey="avgQuality" name="Quality Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Trends timeline */}
        <div className="enterprise-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Financial Progress Timeline ({currentYear})</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="Total Expenses" stroke="#64748b" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking and comparison table */}
      <div className="enterprise-card p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Plant Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Plant Location</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Average Revenue</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Average Profit</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Quality Score</th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Safety Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {plantRankings.map((b, index) => (
                <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-600">₹{(b.avgRevenue / 100000).toFixed(1)} L</td>
                  <td className="px-4 py-3 text-slate-600">₹{(b.profit / 100000).toFixed(1)} L</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${
                      b.avgQuality >= 95 ? 'text-emerald-600' : 'text-slate-700'
                    }`}>
                      {b.avgQuality}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-1.5 py-0.5 rounded font-semibold ${
                      b.safetyIncidents > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {b.safetyIncidents}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
