import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, ShieldAlert, CheckCircle } from 'lucide-react';
import { UserRole } from '@healthcare/shared-types';

const SignupPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
        phoneNumber: phoneNumber || undefined,
        role,
      });

      setIsSuccess(true);
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Registration failed. Please try again.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationMsgs = err.response.data.errors.map((e: any) => e.message).join(', ');
        if (validationMsgs) {
          msg = `${msg}: ${validationMsgs}`;
        }
      }
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 relative overflow-hidden text-slate-100 font-sans">
        <div className="absolute w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4"></div>
        
        <div className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-3">Verify Your Email</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            A verification link has been sent to <span className="font-semibold text-emerald-400">{email}</span>. 
            Please check your inbox and verify your email to activate your account.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-500/10 transition-all duration-200"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6 py-12 relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/4"></div>

      <div className="w-full max-w-lg p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10">
        
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
          <h2 className="text-xl font-bold tracking-tight text-white">Register a New Account</h2>
          <p className="text-xs text-slate-400 mt-1">Get started by creating your secure EHR profile</p>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Registration Alert</p>
              <p className="text-xs mt-0.5 leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@hospital.com"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-755"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100 placeholder-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                User Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg focus:outline-none focus:border-sky-500 text-sm transition-colors text-slate-100"
              >
                <option value={UserRole.PATIENT}>Patient (EHR access)</option>
                <option value={UserRole.DOCTOR}>Doctor (Clinician portal)</option>
                <option value={UserRole.RECEPTIONIST}>Receptionist (Bookings)</option>
                <option value={UserRole.PHARMACIST}>Pharmacist (Inventory)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-4 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
          >
            {isSubmitting ? 'Registering Profile...' : 'Register Profile'}
          </button>
        </form>

        {/* Link back to login */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-sky-400 font-bold hover:text-sky-300 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default SignupPage;
