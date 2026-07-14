import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { setCredentials, setError, setLoading } from '../store/slices/authSlice';
import api from '../services/api';
import { Activity, ShieldAlert, KeyRound } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get path user tried to access before login redirect
  const from = (location.state as any)?.from?.pathname || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data.data;

      // Save credentials in Redux
      dispatch(setCredentials({ user, token: accessToken }));

      // Redirect based on role
      if (from) {
        navigate(from, { replace: true });
      } else {
        const roleRedirects: Record<string, string> = {
          PATIENT: '/patient',
          DOCTOR: '/doctor',
          RECEPTIONIST: '/receptionist',
          PHARMACIST: '/pharmacist',
          ADMIN: '/admin',
        };
        navigate(roleRedirects[user.role] || '/', { replace: true });
      }
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationMsgs = err.response.data.errors.map((e: any) => e.message).join(', ');
        if (validationMsgs) {
          msg = `${msg}: ${validationMsgs}`;
        }
      }
      setFormError(msg);
      dispatch(setError(msg));
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 relative overflow-hidden text-slate-100 font-sans">
      {/* Background radial glow */}
      <div className="absolute w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4"></div>

      {/* Card Box */}
      <div className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500 shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Aegis Health
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your clinical credentials to access your dashboard</p>
        </div>

        {/* Error Notification */}
        {formError && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Authentication Alert</p>
              <p className="text-xs mt-0.5 leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Separator / Alternative options */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest">Or</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        <div className="space-y-3">
          <Link
            to="/login-otp"
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Sign In with OTP Code
          </Link>
        </div>

        {/* Sign up prompt */}
        <div className="mt-8 text-center text-xs text-slate-400">
          New to the platform?{' '}
          <Link to="/signup" className="text-sky-400 font-bold hover:text-sky-300 hover:underline">
            Register Profile
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
