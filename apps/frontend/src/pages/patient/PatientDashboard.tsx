import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { Calendar, FileText, CreditCard, MessageSquare, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Patient Health Portal Active
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back, {user?.firstName}!</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Access your medical files, review diagnosis summaries, schedule visits, and speak to our virtual AI chatbot support.
            </p>
          </div>
          <Link
            to="/patient/book"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors shrink-0"
          >
            <Calendar className="w-4 h-4" />
            Book Consultation Slot
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Visits Scheduled</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Prescriptions</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Unpaid Bills</p>
            <h3 className="text-lg font-bold text-white mt-0.5">₹0</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">AI Predictions</p>
            <h3 className="text-lg font-bold text-white mt-0.5">0</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: EHR / chatbot prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <h3 className="font-bold text-md text-white border-b border-slate-800 pb-3">Upcoming Schedules</h3>
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Calendar className="w-12 h-12 text-slate-700 mb-2" />
            <p className="text-sm font-medium">No upcoming appointments found</p>
            <Link to="/patient/book" className="text-xs text-sky-400 mt-1 hover:underline">Book a slot now</Link>
          </div>
        </div>

        <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <h3 className="font-bold text-md text-white border-b border-slate-800 pb-3">AI Symptom Assistant</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need immediate advice? Type your symptom context into our conversational chatbot.
          </p>
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col gap-3">
            <span className="text-xs text-slate-500 font-mono">Sample prompts:</span>
            <button className="text-left text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800 hover:border-sky-500/30 transition-colors">
              "I have a light dry cough and chest congestion. What should I prepare?"
            </button>
            <Link
              to="/patient/chatbot"
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
