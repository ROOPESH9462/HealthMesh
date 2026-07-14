import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ClipboardList 
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface MedicineItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  medicines: MedicineItem[];
  instructions?: string;
  isFilled: boolean;
  issuedDate: string;
  doctor?: {
    specialization: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

const PatientPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load prescription history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          My Prescription Logs
        </h2>
        <p className="text-xs text-slate-400">Review clinical instructions and medication charts issued by your doctors</p>
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
        <div className="text-center py-12 text-slate-550 text-sm">Querying script registers...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List column */}
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {prescriptions.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
                No issued prescriptions found in timeline
              </div>
            ) : (
              prescriptions.map((script) => {
                const isSelected = selectedPrescription?.id === script.id;
                return (
                  <div
                    key={script.id}
                    onClick={() => setSelectedPrescription(script)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left space-y-3 ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500 shadow-md'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-white">
                          Dr. {script.doctor?.user?.firstName} {script.doctor?.user?.lastName}
                        </h4>
                        <p className="text-[10px] text-sky-400">{script.doctor?.specialization}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        script.isFilled 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                      }`}>
                        {script.isFilled ? 'Dispensed' : 'Active Script'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(script.issuedDate)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details column */}
          <div className="lg:col-span-2">
            {!selectedPrescription ? (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-550 h-full min-h-[300px]">
                <ClipboardList className="w-12 h-12 text-slate-800 mb-2" />
                <p className="text-xs font-semibold">Select a script timeline card to expand chemical compositions</p>
              </div>
            ) : (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                
                {/* Script details header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-md text-white">
                      Dr. {selectedPrescription.doctor?.user?.firstName} {selectedPrescription.doctor?.user?.lastName}
                    </h3>
                    <p className="text-xs text-sky-400">{selectedPrescription.doctor?.specialization}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-450 block uppercase tracking-wider mb-1 font-semibold">Issued Date</span>
                    <span className="text-xs text-slate-200 font-bold">{formatDate(selectedPrescription.issuedDate)}</span>
                  </div>
                </div>

                {/* Chemical list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Drug Regiment</h4>
                  
                  <div className="bg-slate-950/60 rounded-xl border border-slate-850 divide-y divide-slate-900">
                    {selectedPrescription.medicines.map((m, idx) => (
                      <div key={m.medicineId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {idx + 1}. {m.medicineName}
                          </span>
                          <span className="text-[10px] text-slate-450 mt-0.5 block">
                            Dosage schedule: {m.dosage}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs font-semibold">
                          <div className="text-slate-400">
                            <span className="text-[9px] uppercase tracking-wider block text-slate-500 font-bold">Frequency</span>
                            {m.frequency}
                          </div>
                          <div className="text-slate-400">
                            <span className="text-[9px] uppercase tracking-wider block text-slate-500 font-bold">Duration</span>
                            {m.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {selectedPrescription.instructions && (
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-500" />
                      Advice & Notes
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {selectedPrescription.instructions}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-800/60">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${
                    selectedPrescription.isFilled ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedPrescription.isFilled ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Dispensed from Hospital Pharmacy
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Pending pharmacy checkout dispatch
                      </>
                    )}
                  </span>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default PatientPrescriptionsPage;
