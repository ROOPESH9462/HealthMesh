import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { Pill, ClipboardList, AlertCircle, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PharmacyStats {
  kpis: {
    lowStockCount: number;
    totalValuation: number;
    expiredCount: number;
    uniqueMedicinesCount: number;
  };
  categoriesDistribution: Array<{ name: string; count: number }>;
}

const PharmacistDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/pharmacy');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load pharmacy analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-xs font-semibold py-12 text-center">Compiling pharmacy workstation analytics...</div>;
  }

  const kpis = stats?.kpis || {
    lowStockCount: 0,
    totalValuation: 0,
    expiredCount: 0,
    uniqueMedicinesCount: 0
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Pharmacy Inventory Workstation Active
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome, {user?.firstName}!</h2>
            <p className="text-xs text-slate-450 mt-1 max-w-xl">
              Monitor active pharmaceutical stock lists, resolve low-stock thresholds, dispense doctor-issued prescriptions, and track valuations.
            </p>
          </div>
          <Link
            to="/pharmacist/inventory"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-550 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Pill className="w-4 h-4" />
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-455">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unique Items</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.uniqueMedicinesCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-455">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Low Stock Items</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.lowStockCount}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Valuation</p>
            <h3 className="text-lg font-bold text-white mt-0.5">₹{kpis.totalValuation.toLocaleString()}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-455">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expired items</p>
            <h3 className="text-lg font-bold text-white mt-0.5">{kpis.expiredCount}</h3>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category stock quantities bar chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-455" />
            Stock Inventory Volume by Category
          </h3>
          <div className="h-64">
            {stats?.categoriesDistribution && stats.categoriesDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoriesDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-550">
                No pharmacy stock categorized in database
              </div>
            )}
          </div>
        </div>

        {/* Quick action controls panel */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider border-b border-slate-800 pb-3">Stock Overview</h3>
            <p className="text-[11px] text-slate-450 mt-2 leading-relaxed">
              Dispatch orders, review digital medical prescriptions issued by physicians, and edit stock catalog listings.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/pharmacist/inventory"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">View Medicine Catalog</span>
              <span className="text-sky-400">View &rarr;</span>
            </Link>
            <Link
              to="/pharmacist/dispense"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">Prescription Fulfillment Queue</span>
              <span className="text-sky-400">Fulfill &rarr;</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PharmacistDashboard;
