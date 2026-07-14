import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { Calendar, UserPlus, CreditCard, Users, Sparkles, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionistDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Reception Desk Workspace Active
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome, {user?.firstName}!</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Register incoming patients, check doctor slot availabilities, book consultations, and process billing invoices.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/receptionist/patients"
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-805 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </Link>
            <Link
              to="/receptionist/appointments"
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Schedule Visit
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Bookings Today</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">New Patients</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Bills Generated</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Doctors</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <h3 className="font-bold text-md text-white border-b border-slate-800 pb-3">Daily Operations List</h3>
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ClipboardList className="w-12 h-12 text-slate-700 mb-2" />
            <p className="text-sm font-medium">No registrations logged for today</p>
          </div>
        </div>

        <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <h3 className="font-bold text-md text-white border-b border-slate-800 pb-3">Quick Navigation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Quickly lookup patient records or doctor calendars.
          </p>
          <div className="space-y-3">
            <Link
              to="/receptionist/patients"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">Search Patient Directory</span>
              <span className="text-sky-400">View &rarr;</span>
            </Link>
            <Link
              to="/receptionist/appointments"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-sky-500/30 rounded-xl text-xs transition-all"
            >
              <span className="text-slate-300 font-semibold">View Master Calendars</span>
              <span className="text-sky-400">View &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
