import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFormError('Please enter your email address.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Password reset request failed.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4"></div>

      <div className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500 shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Aegis Health
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">Reset Your Password</h2>
          <p className="text-xs text-slate-400 mt-1">We will send instructions to recover your credential profile</p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-14 h-14 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              If an account is associated with that email, a password recovery link has been dispatched to your inbox.
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {formError && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">Reset Error</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
              >
                {isSubmitting ? 'Requesting Reset...' : 'Send Recovery Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
