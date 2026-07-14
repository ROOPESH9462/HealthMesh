import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  XCircle, 
  CheckCircle2, 
  CalendarDays,
  Video
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  status: string;
  symptomsDescription?: string;
  cancellationReason?: string;
  doctor?: {
    specialization: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

const PatientAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation State
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Fetch Patient Appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch appointment logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppt || !cancelReason) return;

    setSubmittingCancel(true);
    try {
      await api.patch(`/appointments/${cancellingAppt.id}/cancel`, {
        cancellationReason: cancelReason
      });
      // Refresh list
      fetchAppointments();
      setCancellingAppt(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Split appointments into Active and History
  const activeStatuses = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'RESCHEDULED'];
  const activeBookings = appointments.filter((appt) => activeStatuses.includes(appt.status));
  const historyBookings = appointments.filter((appt) => !activeStatuses.includes(appt.status));

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      CONFIRMED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      CHECKED_IN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      IN_CONSULTATION: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      NO_SHOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      RESCHEDULED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
    return (
      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${styles[status] || 'bg-slate-500/10 text-slate-450 border-slate-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sky-400" />
          My Consultation Schedules
        </h2>
        <p className="text-xs text-slate-400">Review, modify, or cancel your booked clinical consultations</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Retrieval Warning</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Querying schedules ledger...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: Active Schedules */}
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
              Upcoming Consultations
            </h3>

            {activeBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550">
                <Calendar className="w-10 h-10 text-slate-800 mb-2" />
                <p className="text-xs font-semibold">No active appointments found</p>
              </div>
            ) : (
              activeBookings.map((appt) => (
                <div key={appt.id} className="p-5 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </h4>
                      <p className="text-[11px] text-sky-400 mt-0.5">{appt.doctor?.specialization}</p>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-350">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      {formatDate(appt.date)}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-350">
                      <Clock className="w-4 h-4 text-sky-500" />
                      {appt.timeSlot}
                    </span>
                  </div>

                  {appt.symptomsDescription && (
                    <div className="text-xs text-slate-400 bg-slate-950/20 p-2.5 border border-slate-850 rounded-lg">
                      <span className="font-bold block text-slate-300 text-[10px] uppercase tracking-wider mb-1">Symptoms:</span>
                      {appt.symptomsDescription}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-800/60 pt-3">
                    {appt.status === 'IN_CONSULTATION' && (
                      <button
                        onClick={() => navigate(`/patient/video-consult?appointmentId=${appt.id}`)}
                        className="px-3.5 py-1.5 text-xs font-bold text-sky-450 hover:text-sky-350 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/15 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Video Consultation
                      </button>
                    )}
                    {appt.status !== 'IN_CONSULTATION' && (
                      <button
                        onClick={() => setCancellingAppt(appt)}
                        className="px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 rounded-lg transition-colors"
                      >
                        Cancel Consultation
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* COLUMN 2: History */}
          <div className="space-y-4">
            <h3 className="text-md font-bold text-slate-450 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-slate-600" />
              Past Visit Log
            </h3>

            {historyBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550">
                <CheckCircle2 className="w-10 h-10 text-slate-800 mb-2" />
                <p className="text-xs font-semibold">No past records logged</p>
              </div>
            ) : (
              historyBookings.map((appt) => (
                <div key={appt.id} className="p-5 bg-slate-900/10 border border-slate-850/80 rounded-2xl flex flex-col justify-between gap-3 opacity-60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-300">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-500">{appt.doctor?.specialization}</p>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(appt.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.timeSlot}
                    </span>
                  </div>

                  {appt.cancellationReason && (
                    <div className="text-xs text-rose-400/80 bg-rose-500/5 p-2 border border-rose-500/10 rounded">
                      <span className="font-bold text-[9px] uppercase tracking-wider block mb-0.5">Cancellation Reason:</span>
                      {appt.cancellationReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Cancellation Reason Modal Dialog */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <XCircle className="w-6 h-6 text-rose-500" />
              <h3 className="font-bold text-md text-white">Cancel Appointment Slot</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to cancel your session with <span className="text-white font-semibold">Dr. {cancellingAppt.doctor?.user?.lastName}</span> on {formatDate(cancellingAppt.date)} at {cancellingAppt.timeSlot}?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Please provide a reason *
                </label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Personal emergency, feeling better, duplicate slot..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rose-500 h-24 resize-none placeholder-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors"
                >
                  {submittingCancel ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientAppointmentsPage;
