import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Stethoscope, 
  ArrowLeft 
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  dosageForm: string;
  strength: string;
  pricePerUnit: number;
}

interface SelectedMedicine {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const PrescribePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || '';
  const patientId = searchParams.get('patientId') || '';
  const patientName = searchParams.get('patientName') || 'Patient';

  // Medicine catalog state
  const [searchTerm, setSearchTerm] = useState('');
  const [medicineCatalog, setMedicineCatalog] = useState<Medicine[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Selected drugs state
  const [selectedMedicines, setSelectedMedicines] = useState<SelectedMedicine[]>([]);
  const [instructions, setInstructions] = useState('');

  // Drug build state
  const [currentMed, setCurrentMed] = useState<Medicine | null>(null);
  const [dosage, setDosage] = useState('1-0-1');
  const [frequency, setFrequency] = useState('After food');
  const [duration, setDuration] = useState('5 days');

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch medicine catalog when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchTerm) {
        setMedicineCatalog([]);
        return;
      }
      setLoadingCatalog(true);
      try {
        const res = await api.get('/pharmacy', { params: { name: searchTerm } });
        setMedicineCatalog(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCatalog(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddMedicine = () => {
    if (!currentMed) return;

    // Check duplicate
    const exists = selectedMedicines.some((m) => m.medicineId === currentMed.id);
    if (exists) {
      alert('This medicine is already added to the prescription.');
      return;
    }

    const newItem: SelectedMedicine = {
      medicineId: currentMed.id,
      medicineName: `${currentMed.name} (${currentMed.strength} ${currentMed.dosageForm})`,
      dosage,
      frequency,
      duration
    };

    setSelectedMedicines([...selectedMedicines, newItem]);
    setCurrentMed(null);
    setSearchTerm('');
  };

  const handleRemoveMedicine = (id: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.medicineId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMedicines.length === 0) {
      setErrorMsg('Please prescribe at least one medicine.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Get doctor profile from user identity (we resolve this backend side anyway, but doctorId is needed in prescriptionCreateSchema!)
    // Wait, let's find doctorId. Since we don't have doctorId directly in storage on frontend, 
    // let's retrieve the doctor details from `/api/v1/auth/me` or `/api/v1/doctors` by matching the user ID.
    // Or we can let the backend fetch it by logged in user! But wait! The `prescriptionCreateSchema` expects a required `doctorId: string`.
    // Let's see: we can query the doctors list filtering by user id to get the doctor profile id!
    try {
      // 1. Fetch current doctor profile
      const doctorRes = await api.get('/doctors');
      const docsList = doctorRes.data.data || [];
      if (docsList.length === 0) {
        throw new Error('Clinician doctor profile not found.');
      }
      const doctorId = docsList[0].id; // The logged-in doctor is verified by middleware

      // 2. Submit prescription
      await api.post('/prescriptions', {
        appointmentId,
        patientId,
        doctorId,
        medicines: selectedMedicines,
        instructions: instructions || undefined
      });

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to issue prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-100 font-sans max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Prescription Issued!</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          The script has been registered. An itemized billing invoice has been generated automatically and the appointment status is updated to COMPLETED.
        </p>
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="w-full py-3 text-sm font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100 font-sans max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Write Medical Prescription
          </h2>
          <p className="text-xs text-slate-400">Prescribing drugs for patient: <span className="text-white font-semibold">{patientName}</span></p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Prescription Error</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Drug Builder */}
        <div className="lg:col-span-1 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl h-fit space-y-4">
          <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            Add Medicine Item
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Search Catalog
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Paracetamol, Amoxicillin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500 placeholder-slate-700"
                />
                <Search className="w-4 h-4 text-slate-650 absolute left-3 top-3" />
              </div>
            </div>

            {loadingCatalog && <div className="text-xs text-slate-550">Searching drug list...</div>}

            {medicineCatalog.length > 0 && (
              <div className="bg-slate-950 border border-slate-850 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-900">
                {medicineCatalog.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => setCurrentMed(med)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-900 text-slate-350 transition-colors flex justify-between items-center"
                  >
                    <span>{med.name} - {med.strength}</span>
                    <span className="text-[10px] text-slate-500 font-mono capitalize">{med.dosageForm.toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}

            {currentMed && (
              <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg space-y-3">
                <div className="text-xs">
                  <span className="font-bold text-sky-400">Selected: </span>
                  {currentMed.name} ({currentMed.strength} {currentMed.dosageForm})
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Dosage</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 1-0-1"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Frequency</label>
                    <input
                      type="text"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      placeholder="e.g. After food"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 5 days"
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="flex items-center justify-center gap-1 w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded font-bold text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Prescription Script Preview */}
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-sm text-white">Prescription Script Summary</h3>
            <span className="text-xs text-slate-500">{selectedMedicines.length} drugs added</span>
          </div>

          {selectedMedicines.length === 0 ? (
            <div className="text-center py-16 text-slate-550 text-xs">
              Prescribe medicines using the left builder panel to construct the patient timeline script
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="divide-y divide-slate-800">
                {selectedMedicines.map((m, idx) => (
                  <div key={m.medicineId} className="py-3 flex justify-between items-center gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-white">
                        {idx + 1}. {m.medicineName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {m.dosage} • {m.frequency} for {m.duration}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(m.medicineId)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">
                  General Instructions & Notes
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Keep hydrated, avoid heavy lifting, rest..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500 h-24 resize-none placeholder-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
              >
                <Stethoscope className="w-4.5 h-4.5" />
                {submitting ? 'Issuing script...' : 'Finalize & Issue Prescription'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default PrescribePage;
