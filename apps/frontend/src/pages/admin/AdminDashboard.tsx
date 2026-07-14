import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Cpu, 
  CheckCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AdminStats {
  kpis: {
    totalUsers: number;
    totalAppointments: number;
    totalRevenue: number;
    totalPredictions: number;
    totalReports: number;
    totalInventoryValue: number;
    avgSessionDuration: number;
  };
  statusCounts: Record<string, number>;
  revenueTimeline: Array<{ period: string; revenue: number }>;
  dailyTimeline: Array<{ date: string; count: number }>;
  aiStatusCounts: Record<string, number>;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa'];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/admin');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs font-semibold py-12 text-center">Compiling administrative analytics data...</div>;
  }

  // Pre-process status breakdown for Pie Charts
  const appointmentPieData = stats?.statusCounts 
    ? Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value }))
    : [{ name: 'No Bookings', value: 1 }];

  const aiPieData = stats?.aiStatusCounts 
    ? Object.entries(stats.aiStatusCounts).map(([name, value]) => ({ name, value }))
    : [{ name: 'No Inferences', value: 1 }];

  const kpis = stats?.kpis || {
    totalUsers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    totalPredictions: 0,
    totalReports: 0,
    totalInventoryValue: 0,
    avgSessionDuration: 0
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Administrative Command Console Active
            </div>
            <h2 className="text-2xl font-bold text-white">Platform Governance Overview</h2>
            <p className="text-xs text-slate-450 mt-1 max-w-xl">
              Track global clinician sessions, billing revenue, pharmacy valuations, and machine learning inference logs.
            </p>
          </div>
          <Link
            to="/admin/feature-flags"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-550 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" />
            System Settings
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-450">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Accounts</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.totalUsers}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-450">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
            <h3 className="text-lg font-bold text-white mt-0.5">₹{kpis.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Inferences</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.totalPredictions}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Booked Visits</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.totalAppointments}</h3>
          </div>
        </div>
      </div>

      {/* Graphical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Area Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Revenue Accumulation Trends (Monthly)
          </h3>
          <div className="h-64">
            {stats?.revenueTimeline && stats.revenueTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#34d399" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-550">
                No billing transactions recorded
              </div>
            )}
          </div>
        </div>

        {/* System Control Options */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider border-b border-slate-800 pb-3">Administrative Actions</h3>
            <p className="text-[11px] text-slate-450 mt-2 leading-relaxed">
              Quick links to configure feature toggles and inspect secure authentication audit logs.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/admin/feature-flags"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">Feature Toggle Flags</span>
              <span className="text-sky-400">Manage &rarr;</span>
            </Link>
            <Link
              to="/admin/audit-logs"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">Access Audit Registry</span>
              <span className="text-sky-400">Inspect &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Double Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pie chart 1: Appointment status */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider self-start flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-indigo-400" />
            Appointments Status Breakdown
          </h3>
          <div className="w-full h-56 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
            {appointmentPieData.map((d, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-300">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart 2: AI prediction outcomes */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider self-start flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            AI prediction Status distribution
          </h3>
          <div className="w-full h-56 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aiPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {aiPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
            {aiPieData.map((d, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-300">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
