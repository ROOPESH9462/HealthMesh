import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar, 
  User, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Clipboard
} from 'lucide-react';

interface Doctor {
  id: string;
  specialization: string;
  consultationFee: number;
  availableDays: string[];
  timeSlots: string[];
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
}

interface Slot {
  timeSlot: string;
  isAvailable: boolean;
}

const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter state
  const [specialization, setSpecialization] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Selection state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Submit states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Specializations master list
  const specializations = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics'
  ];

  // Fetch Doctors on mount / filter change
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.get('/doctors', {
          params: { specialization: specialization || undefined }
        });
        setDoctors(res.data.data || []);
      } catch (err: any) {
        console.error('Failed to load doctors list', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [specialization]);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg(null);
      try {
        const res = await api.get('/appointments/slots', {
          params: {
            doctorId: selectedDoctor.id,
            date: selectedDate
          }
        });
        setSlots(res.data.data || []);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to retrieve available slots.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctor, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setErrorMsg('Please select a doctor, scheduling date, and time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptomsDescription: symptoms || undefined
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Booking failed. This slot may have been taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date for picker (today)
  const getMinDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-100 font-sans max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Booking Confirmed!</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Your consultation with Dr. {selectedDoctor?.user?.lastName} on {selectedDate} at {selectedSlot} has been registered successfully.
        </p>
        <button
          onClick={() => navigate('/patient')}
          className="w-full py-3 text-sm font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-255"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-sky-400" />
          Schedule Consultation Visit
        </h2>
        <p className="text-xs text-slate-400">Select clinical specialists and choose slot configurations</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Scheduling Conflict Warning</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Doctors selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
            <span className="text-sm font-semibold text-slate-300">Filter Specialty:</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={specialization}
                onChange={(e) => {
                  setSpecialization(e.target.value);
                  setSelectedDoctor(null);
                }}
                className="w-full sm:w-60 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">All Specialties</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingDoctors ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading doctors profiles...</div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No clinicians registered for this specialty</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setSelectedSlot('');
                    }}
                    className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-4 ${
                      isSelected 
                        ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/5' 
                        : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">
                        Dr. {doc.user?.firstName} {doc.user?.lastName}
                      </h4>
                      <p className="text-xs text-sky-400 font-semibold">{doc.specialization}</p>
                      <div className="flex flex-col gap-0.5 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Fee: ₹{doc.consultationFee}
                        </span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Days: {doc.availableDays.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Date & Slots Selector */}
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-5 h-fit">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Scheduling Configuration
          </h3>

          {!selectedDoctor ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Select a doctor profile from the grid to configure timings
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1. Consultation Date
                </label>
                <input
                  type="date"
                  required
                  min={getMinDateString()}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    2. Select Time Slot
                  </label>
                  {loadingSlots ? (
                    <div className="text-xs text-slate-500">Querying available slots...</div>
                  ) : slots.length === 0 ? (
                    <div className="text-xs text-rose-400/80 bg-rose-500/5 p-3 rounded border border-rose-500/10">
                      Dr. {selectedDoctor.user?.lastName} is not available on this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slots.map((s) => {
                        const isSelected = selectedSlot === s.timeSlot;
                        return (
                          <button
                            key={s.timeSlot}
                            type="button"
                            disabled={!s.isAvailable}
                            onClick={() => setSelectedSlot(s.timeSlot)}
                            className={`py-2 px-2.5 rounded text-xs text-center font-mono border transition-all ${
                              !s.isAvailable 
                                ? 'bg-slate-950 border-slate-900 text-slate-650 opacity-30 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-sky-500/20 border-sky-500 text-sky-400 font-bold'
                                  : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            {s.timeSlot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  3. Reason / Symptoms Description
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Tell us what symptoms you have (e.g. fever, headache, joint paint...)"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500 h-24 resize-none placeholder-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedSlot}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200 disabled:opacity-40"
              >
                <Clipboard className="w-4.5 h-4.5" />
                {isSubmitting ? 'Confirming Visit...' : 'Confirm Book Consultation'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookAppointmentPage;
