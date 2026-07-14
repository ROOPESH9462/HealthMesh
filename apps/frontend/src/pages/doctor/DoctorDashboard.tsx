import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { 
  Calendar, 
  Activity, 
  Sparkles, 
  Clock, 
  FileSpreadsheet, 
  Users, 
  TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DoctorStats {
  kpis: {
    todaysAppointmentsCount: number;
    upcomingAppointmentsCount: number;
    completedConsultationsCount: number;
    avgDuration: number;
    prescriptionsCount: number;
  };
  medicationDistribution: Array<{ name: string; count: number }>;
  dailyVolumesTimeline: Array<{ date: string; count: number }>;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f87171', '#fbbf24'];

const DoctorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/doctor');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load doctor analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs font-semibold py-12 text-center">Compiling clinical dashboard analytics...</div>;
  }

  const kpis = stats?.kpis || {
    todaysAppointmentsCount: 0,
    upcomingAppointmentsCount: 0,
    completedConsultationsCount: 0,
    avgDuration: 0,
    prescriptionsCount: 0
  };

  const medicationPieData = stats?.medicationDistribution && stats.medicationDistribution.length > 0
    ? stats.medicationDistribution
    : [{ name: 'No Prescriptions', count: 1 }];

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Clinician Portal Active
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back, Dr. {user?.lastName || 'Clinician'}!</h2>
            <p className="text-xs text-slate-450 mt-1 max-w-xl">
              Access scheduled appointments, check patient charts, evaluate AI-driven diagnosis predictions, and write electronic prescriptions.
            </p>
          </div>
          <Link
            to="/doctor/appointments"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-550 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Calendar className="w-4 h-4" />
            Manage Schedules
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-450">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Today's Visits</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.todaysAppointmentsCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Upcoming Slots</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.upcomingAppointmentsCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-450">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Prescriptions</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.prescriptionsCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Session</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.avgDuration} sec</h3>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly consultations bar chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-450" />
            Weekly Consultation Volumes (Daily)
          </h3>
          <div className="h-64">
            {stats?.dailyVolumesTimeline && stats.dailyVolumesTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyVolumesTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-550">
                No completed consults in the last 7 days
              </div>
            )}
          </div>
        </div>

        {/* Prescription medication distribution pie chart */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col items-center justify-between">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider self-start flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Medication Prescribed Share
          </h3>
          
          <div className="w-full h-44 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {medicationPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full space-y-2 max-h-28 overflow-y-auto pr-1">
            {medicationPieData.map((d, index) => (
              <div key={index} className="flex justify-between items-center text-[10px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-slate-300 truncate max-w-[130px]">{d.name}</span>
                </div>
                <span className="text-slate-500">{d.count} rx</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DoctorDashboard;
