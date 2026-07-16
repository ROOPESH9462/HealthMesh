import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  BrainCircuit, 
  ShieldCheck, 
  CalendarCheck, 
  HeartPulse, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  FileCheck
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white font-sans overflow-x-hidden relative">
      {/* Background Glowing Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* ----------------------------------------------------
          NAVBAR HEADER
          ---------------------------------------------------- */}
      <header className="fixed top-0 inset-x-0 z-40 bg-slate-950/75 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/25">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              HealthMesh
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 rounded-lg shadow-lg shadow-sky-500/20 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------
          HERO SECTION
          ---------------------------------------------------- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Hospital Management Platform
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-6">
            Intelligent Healthcare <br />
            <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
              Driven by Clinical AI
            </span>
          </h1>

          {/* Description */}
          <p className="text-md md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            HealthMesh combines secure, modular hospital workflows with AI diagnostic decision support, 
            smart prescription OCR scanning, WebRTC video consultations, and real-time alerts.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="group flex items-center gap-2 px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-xl shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Create Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login" 
              className="px-7 py-3 text-sm font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-all duration-200"
            >
              Demo Login
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CAPABILITIES / FEATURES GRID
          ---------------------------------------------------- */}
      <section className="py-20 px-6 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Core Platform Capabilities</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Our architecture isolates complex processes into modular services to ensure optimal reliability and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 mb-6 group-hover:bg-sky-500/20 transition-colors">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Diagnostic Decision Support</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empower clinicians with deep learning models (DenseNet121) to analyze X-ray scans and evaluate multi-symptom probability indexes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Conversational RAG Chatbot</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Patients receive immediate context-grounded health summaries fetched dynamically from verified clinical databases using semantic vector spaces.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Prescription OCR Scanner</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Scan handwritten prescriptions using custom OCR pipelines to automatically extract drug schedules, dosages, and stock items.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mb-6 group-hover:bg-amber-500/20 transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Modular Scheduling</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Prevents scheduling conflicts with atomic MongoDB transaction slots, allowing patients to schedule, delay, or swap booking times.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 mb-6 group-hover:bg-rose-500/20 transition-colors">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Live Consultations</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enables high-fidelity video consults directly from the browser using WebRTC signaling channels backed by Socket.IO servers.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/60 transition-all duration-300 group">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-6 group-hover:bg-purple-500/20 transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Privacy-Focused Security</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Built with strict role-based access control (RBAC), end-to-end HTTPS/WSS encryption, and detailed audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          FOOTER
          ---------------------------------------------------- */}
      <footer className="py-12 border-t border-slate-900 px-6 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-400">HealthMesh Management</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-[10px] text-slate-600 font-mono tracking-wider">Created by roopesh</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
