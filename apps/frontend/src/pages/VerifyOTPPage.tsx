import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setCredentials, setError, setLoading } from '../store/slices/authSlice';
import api from '../services/api';
import { Activity, ShieldAlert, ArrowLeft, Send, ShieldCheck } from 'lucide-react';

const VerifyOTPPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFormError('Please enter your email address.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/request-otp', { email });
      setOtpSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to dispatch verification code.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setFormError('Please enter the 6-digit OTP code.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { accessToken, user } = response.data.data;

      // Save credentials in Redux
      dispatch(setCredentials({ user, token: accessToken }));

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        PATIENT: '/patient',
        DOCTOR: '/doctor',
        RECEPTIONIST: '/receptionist',
        PHARMACIST: '/pharmacist',
        ADMIN: '/admin',
      };
      navigate(roleRedirects[user.role] || '/', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed. Code is invalid or has expired.';
      setFormError(msg);
      dispatch(setError(msg));
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4"></div>

      <div className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500 shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              HealthMesh
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {otpSent ? 'Enter Security Code' : 'Request Login OTP'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {otpSent 
              ? `We sent a 6-digit numeric verification code to ${email}` 
              : 'Enter your registered email address to receive a 6-digit secure code'
            }
          </p>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Security Alert</p>
              <p className="text-xs mt-0.5 leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        {!otpSent ? (
          /* Step 1: Request OTP */
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
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
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Requesting OTP...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP */
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                6-Digit Security Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm font-mono tracking-widest text-center text-xl transition-colors text-slate-100 placeholder-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-500/10 transition-all duration-200"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              {isSubmitting ? 'Verifying Code...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors"
            >
              Use a different email address
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Password Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyOTPPage;
