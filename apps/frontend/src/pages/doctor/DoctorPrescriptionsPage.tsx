import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  AlertCircle, 
  Calendar, 
  FileSpreadsheet
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
  patientId: {
    userId?: {
      firstName: string;
      lastName: string;
    };
  };
  medicines: MedicineItem[];
  instructions?: string;
  issuedDate: string;
  isFilled: boolean;
}

interface MedicalDocument {
  id: string;
  patientId: {
    userId?: {
      firstName: string;
      lastName: string;
    };
  };
  documentType: string;
  title: string;
  fileUrl: string;
  uploadDate: string;
  isVerifiedByDoctor: boolean;
}

const DoctorPrescriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'lab_verify'>('prescriptions');
  
  // Data lists state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labDocuments, setLabDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [presRes, docsRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/lab')
      ]);
      setPrescriptions(presRes.data.data || []);
      setLabDocuments(docsRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load medical records registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleVerifyReport = async (reportId: string) => {
    try {
      await api.patch(`/lab/${reportId}/verify`);
      alert('Medical report verified and signed successfully.');
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify lab report.');
    }
  };

  const pendingVerificationReports = labDocuments.filter((doc) => !doc.isVerifiedByDoctor);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-400" />
          Clinical Documents & Sign-off desk
        </h2>
        <p className="text-xs text-slate-400">Review patient scripts archives and authenticate incoming lab documents scans</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Retrieval Notice</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabs toggle */}
      <div className="flex gap-2 border-b border-slate-900 pb-1">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'prescriptions'
              ? 'border-sky-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Prescription History Log
        </button>
        <button
          onClick={() => setActiveTab('lab_verify')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'lab_verify'
              ? 'border-sky-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Pending Lab Sign-offs ({pendingVerificationReports.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Querying registers data...</div>
      ) : activeTab === 'prescriptions' ? (
        
        // TAB 1: Prescriptions list
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
              No prescriptions issued by you found in the registry
            </div>
          ) : (
            prescriptions.map((script) => (
              <div key={script.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Patient: {script.patientId?.userId?.firstName} {script.patientId?.userId?.lastName}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">ID: #{script.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    script.isFilled 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                  }`}>
                    {script.isFilled ? 'Dispensed' : 'Active Script'}
                  </span>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-950/60 rounded-xl text-xs">
                  {script.medicines.map((m, i) => (
                    <div key={i} className="flex justify-between text-slate-350">
                      <span>{i + 1}. {m.medicineName}</span>
                      <span className="text-slate-500">{m.dosage} • {m.duration}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-semibold border-t border-slate-900 pt-3">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  Issued Date: {formatDate(script.issuedDate)}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        
        // TAB 2: Lab reports sign off desk
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingVerificationReports.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
              All incoming laboratory reports have been clinically reviewed and verified
            </div>
          ) : (
            pendingVerificationReports.map((doc) => (
              <div key={doc.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Patient: {doc.patientId?.userId?.firstName} {doc.patientId?.userId?.lastName} • {doc.documentType}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15">
                    Needs Review
                  </span>
                </div>

                <div className="flex gap-4 text-xs font-semibold text-slate-400 p-2 bg-slate-950/20 rounded">
                  <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-bold"
                  >
                    Open Attachment
                  </a>
                </div>

                <div className="flex justify-end border-t border-slate-900 pt-3 mt-1">
                  <button
                    onClick={() => handleVerifyReport(doc.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 rounded-lg shadow-md transition-colors"
                  >
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                    Verify & Sign Off Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default DoctorPrescriptionsPage;
