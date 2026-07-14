import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 text-center text-slate-100 font-sans">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Access Denied</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        You do not have the required role-based authorization clearances to view this clinical workstation page.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
};

export default UnauthorizedPage;
