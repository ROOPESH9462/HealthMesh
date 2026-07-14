import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet,
  Activity
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
  patient?: {
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  doctor?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

const PharmacistDispensePage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispenseLoading, setDispenseLoading] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch prescription queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDispenseSubmit = async (prescriptionId: string) => {
    setDispenseLoading(true);
    setErrorMsg(null);
    try {
      await api.patch(`/prescriptions/${prescriptionId}/dispense`);
      
      // Refresh local view
      fetchPrescriptions();
      setSelectedPrescription(null);
      alert('Prescription drugs dispensed and inventory stocks updated.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispense prescription. Check stock levels.');
    } finally {
      setDispenseLoading(false);
    }
  };

  const pendingScripts = prescriptions.filter((p) => !p.isFilled);
  const filledScripts = prescriptions.filter((p) => p.isFilled);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-400" />
          Medication Dispensing Desk
        </h2>
        <p className="text-xs text-slate-400">Review pending prescriptions, verify drug dosages, and record dispensations</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Dispensing Error Notice</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Querying pending prescriptions queue...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Queue column */}
          <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              Pending Queue ({pendingScripts.length})
            </h3>

            {pendingScripts.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
                No active scripts in the queue
              </div>
            ) : (
              pendingScripts.map((script) => {
                const isSelected = selectedPrescription?.id === script.id;
                return (
                  <div
                    key={script.id}
                    onClick={() => {
                      setSelectedPrescription(script);
                      setErrorMsg(null);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left space-y-3 ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500 shadow-md'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-white">
                          Patient: {script.patient?.user?.firstName} {script.patient?.user?.lastName}
                        </h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          Issued by: Dr. {script.doctor?.user?.firstName} {script.doctor?.user?.lastName}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase">
                        Unfilled
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(script.issuedDate)}
                      </span>
                      <span>{script.medicines.length} items</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Past Dispensed Queue header */}
            <h3 className="text-xs font-bold text-slate-450 mt-6 block mb-2">
              Recently Dispensed ({filledScripts.length})
            </h3>
            {filledScripts.slice(0, 5).map((script) => (
              <div key={script.id} className="p-3 bg-slate-900/10 border border-slate-850 rounded-xl flex items-center justify-between gap-3 opacity-60">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-xs text-slate-350">
                    {script.patient?.user?.firstName} {script.patient?.user?.lastName}
                  </h4>
                  <p className="text-[9px] text-slate-500">{formatDate(script.issuedDate)}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase">Dispensed</span>
              </div>
            ))}
          </div>

          {/* Details column */}
          <div className="lg:col-span-2">
            {!selectedPrescription ? (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-550 h-full min-h-[300px]">
                <Activity className="w-12 h-12 text-slate-800 mb-2" />
                <p className="text-xs font-semibold">Select a script from the queue to verify details and dispense</p>
              </div>
            ) : (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Patient: {selectedPrescription.patient?.user?.firstName} {selectedPrescription.patient?.user?.lastName}
                    </h3>
                    <p className="text-xs text-slate-450 mt-0.5">Email: {selectedPrescription.patient?.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1 font-semibold">Written By</span>
                    <span className="text-xs text-slate-200 font-bold">Dr. {selectedPrescription.doctor?.user?.lastName}</span>
                  </div>
                </div>

                {/* Chemical list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Required Drugs & Instructions</h4>
                  
                  <div className="bg-slate-950/60 rounded-xl border border-slate-850 divide-y divide-slate-900">
                    {selectedPrescription.medicines.map((m, idx) => (
                      <div key={m.medicineId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-white block">
                            {idx + 1}. {m.medicineName}
                          </span>
                          <span className="text-[10px] text-slate-450 mt-0.5 block">
                            Dosage: {m.dosage}
                          </span>
                        </div>
                        <div className="flex gap-4 font-semibold text-slate-400">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Frequency</span>
                            {m.frequency}
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Duration</span>
                            {m.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {selectedPrescription.instructions && (
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-300">Doctor Advice Notes</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedPrescription.instructions}
                    </p>
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => handleDispenseSubmit(selectedPrescription.id)}
                    disabled={dispenseLoading}
                    className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 rounded-lg shadow-md transition-all duration-200"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {dispenseLoading ? 'Fulfilling...' : 'Confirm Fulfill & Dispense'}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default PharmacistDispensePage;
