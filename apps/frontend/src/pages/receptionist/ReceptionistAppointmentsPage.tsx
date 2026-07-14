import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  CalendarDays, 
  PlusCircle
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface Patient {
  id: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Doctor {
  id: string;
  specialization: string;
  availableDays: string[];
  timeSlots: string[];
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  status: string;
  symptomsDescription?: string;
  cancellationReason?: string;
  patient?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Slot {
  timeSlot: string;
  isAvailable: boolean;
}

const ReceptionistAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Cancellation State
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Fetch Master Appointments List
  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load scheduling lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Load Patients and Doctors when opening modal
  useEffect(() => {
    if (!showBookingModal) return;

    const loadData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors')
        ]);
        setPatientsList(patientsRes.data.data || []);
        setDoctorsList(doctorsRes.data.data || []);
      } catch (err: any) {
        console.error('Failed to load clinic directories', err);
      }
    };
    loadData();
  }, [showBookingModal]);

  // Load slots when doctor or date changes in booking modal
  useEffect(() => {
    if (!selectedDoctorId || !bookingDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get('/appointments/slots', {
          params: {
            doctorId: selectedDoctorId,
            date: bookingDate
          }
        });
        setSlots(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, bookingDate]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !bookingDate || !selectedSlot) {
      alert('Please fill in all details.');
      return;
    }

    setBookingSubmitting(true);
    try {
      await api.post('/appointments', {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        date: bookingDate,
        timeSlot: selectedSlot,
        symptomsDescription: symptoms || undefined
      });
      fetchAppointments();
      setShowBookingModal(false);
      // Reset
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setBookingDate('');
      setSelectedSlot('');
      setSymptoms('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.patch(`/appointments/${apptId}/check-in`);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to check-in patient.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppt || !cancelReason) return;

    setSubmittingCancel(true);
    try {
      await api.patch(`/appointments/${cancellingAppt.id}/cancel`, {
        cancellationReason: cancelReason
      });
      fetchAppointments();
      setCancellingAppt(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setSubmittingCancel(false);
    }
  };

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-sky-400" />
            Central Appointments Console
          </h2>
          <p className="text-xs text-slate-400">Schedule bookings, register arrivals, and manage clinical schedules</p>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Schedule Visit
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Operations Alert</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Querying active schedules...</div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-555">
          <Calendar className="w-12 h-12 text-slate-800 mb-2" />
          <p className="text-sm font-semibold">No appointments registered in the ledger</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((appt) => {
            const isCompletedOrCancelled = appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'NO_SHOW';
            const isCheckedIn = appt.status === 'CHECKED_IN' || appt.status === 'IN_CONSULTATION';

            return (
              <div key={appt.id} className="p-5 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Pt: {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                    </h4>
                    <p className="text-[10px] text-sky-400 mt-0.5">
                      Doc: Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                    </p>
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
                    <span className="font-bold block text-slate-300 text-[10px] uppercase tracking-wider mb-0.5">Symptoms:</span>
                    {appt.symptomsDescription}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-800/60">
                  <button
                    disabled={isCompletedOrCancelled || isCheckedIn}
                    onClick={() => handleCheckIn(appt.id)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 rounded-lg transition-colors flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Check In
                  </button>
                  <button
                    disabled={isCompletedOrCancelled}
                    onClick={() => setCancellingAppt(appt)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 rounded-lg transition-colors flex-1 disabled:opacity-30"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book on Behalf Modal Dialog */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-md text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                Schedule Consultation Slot
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1. Select Registered Patient
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patientsList.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.user?.firstName} {pt.user?.lastName} ({pt.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  2. Select Medical Clinician
                </label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedSlot('');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user?.firstName} {doc.user?.lastName} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    3. Date of Visit
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    4. Available Timings
                  </label>
                  {loadingSlots ? (
                    <div className="text-xs text-slate-500 pt-2.5">Fetching slots...</div>
                  ) : slots.length === 0 ? (
                    <div className="text-xs text-slate-550 pt-2.5">No slots available</div>
                  ) : (
                    <select
                      required
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Select Slot --</option>
                      {slots.filter(s => s.isAvailable).map((s) => (
                        <option key={s.timeSlot} value={s.timeSlot}>{s.timeSlot}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  5. Clinical Stated Symptoms
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Stated symptoms from receptionist logs..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500 h-20 resize-none placeholder-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting || !selectedSlot}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
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
              Cancel the session for patient <span className="text-white font-semibold">{cancellingAppt.patient?.user?.firstName}</span> with Dr. {cancellingAppt.doctor?.user?.lastName} on {formatDate(cancellingAppt.date)} at {cancellingAppt.timeSlot}?
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
                  placeholder="e.g., Patient rescheduled, doctor called out, clinic closing..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rose-500 h-24 resize-none placeholder-slate-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg transition-colors"
                >
                  Close
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

export default ReceptionistAppointmentsPage;
