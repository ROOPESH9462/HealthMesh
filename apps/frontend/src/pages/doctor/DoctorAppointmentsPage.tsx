import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Video, 
  FileSpreadsheet,
  Stethoscope
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  status: string;
  symptomsDescription?: string;
  patient?: {
    dateOfBirth: string;
    gender: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
    };
  };
}

const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Date filter (defaults to today in local YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/appointments', {
        params: {
          startDate: selectedDate,
          endDate: selectedDate
        }
      });
      setAppointments(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch doctor agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const handleComplete = async (apptId: string) => {
    try {
      await api.patch(`/appointments/${apptId}/complete`);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete consultation.');
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

  // Age calculation
  const getAge = (dobString: string): number => {
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-400" />
            My Consultation Queue
          </h2>
          <p className="text-xs text-slate-400">Track and review incoming patient slots for the day</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Target Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>
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
        <div className="text-center py-12 text-slate-550 text-sm">Querying clinical queue...</div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-550">
          <Calendar className="w-12 h-12 text-slate-800 mb-2" />
          <p className="text-sm font-semibold">No appointments scheduled for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((appt) => (
            <div key={appt.id} className="p-5 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Patient: {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {appt.patient?.gender} • {appt.patient?.dateOfBirth ? `${getAge(appt.patient.dateOfBirth)} Yrs` : 'N/A'}
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
                  <span className="font-bold block text-slate-300 text-[10px] uppercase tracking-wider mb-1">Stated Symptoms:</span>
                  {appt.symptomsDescription}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between items-center gap-2">
                  <button
                    disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'}
                    onClick={() => handleComplete(appt.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 rounded-lg transition-colors flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                  <button
                    disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'}
                    onClick={() => navigate(`/doctor/video-consult?appointmentId=${appt.id}`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/15 rounded-lg transition-colors flex-1 disabled:opacity-30"
                  >
                    <Video className="w-4 h-4" />
                    Consult
                  </button>
                </div>
                <button
                  disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'}
                  onClick={() => navigate(`/doctor/prescribe?appointmentId=${appt.id}&patientId=${(appt as any).patientId}&patientName=${appt.patient?.user?.firstName || 'Patient'} ${appt.patient?.user?.lastName || ''}`)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 rounded-lg transition-colors disabled:opacity-30"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Prescribe Medication
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DoctorAppointmentsPage;
