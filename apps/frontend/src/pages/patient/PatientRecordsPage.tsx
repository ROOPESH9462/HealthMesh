import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  Calendar, 
  Upload, 
  AlertCircle, 
  FolderOpen,
  FileCheck2
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

interface MedicalDocument {
  id: string;
  documentType: string;
  title: string;
  fileUrl: string;
  uploadDate: string;
  isVerifiedByDoctor: boolean;
  doctorId?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

const PatientRecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'lab_reports'>('prescriptions');
  
  // Data lists state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labDocuments, setLabDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Self upload states
  const [patientProfileId, setPatientProfileId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('OTHER');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch prescriptions, lab documents, and patient profile
      const [presRes, docsRes, patientProfileRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/lab'),
        api.get('/patients') // Backend filters patient list by logged-in patient userId
      ]);
      
      setPrescriptions(presRes.data.data || []);
      setLabDocuments(docsRes.data.data || []);
      
      const profiles = patientProfileRes.data.data || [];
      if (profiles.length > 0) {
        setPatientProfileId(profiles[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load medical records timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfileId || !uploadFile || !uploadTitle) {
      alert('Missing upload details.');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('patientId', patientProfileId);
    formData.append('documentType', uploadType);
    formData.append('title', uploadTitle);
    formData.append('file', uploadFile);

    try {
      await api.post('/lab', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchRecords();
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFile(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-sky-400" />
            Clinical Records & Timeline
          </h2>
          <p className="text-xs text-slate-400">Review your full diagnostic file, prescriptions, and lab tests archives</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
        >
          <Upload className="w-4.5 h-4.5" />
          Upload Health Scan
        </button>
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
          Active Prescriptions
        </button>
        <button
          onClick={() => setActiveTab('lab_reports')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'lab_reports'
              ? 'border-sky-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          Lab Reports & Scans
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-550 text-sm">Loading health archives...</div>
      ) : activeTab === 'prescriptions' ? (
        
        // Tab 1: Prescriptions list
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
              No prescriptions recorded in your clinical log
            </div>
          ) : (
            prescriptions.map((script) => (
              <div key={script.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Dr. {script.doctor?.user?.firstName} {script.doctor?.user?.lastName}
                    </h4>
                    <p className="text-xs text-sky-400 font-semibold">{script.doctor?.specialization}</p>
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
        
        // Tab 2: Lab Reports list
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labDocuments.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl text-slate-550 text-xs">
              No laboratory reports or scans found in your records
            </div>
          ) : (
            labDocuments.map((doc) => (
              <div key={doc.id} className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mt-0.5">{doc.documentType}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    doc.isVerifiedByDoctor
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                  }`}>
                    {doc.isVerifiedByDoctor ? 'Clinically Reviewed' : 'Awaiting Review'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-sky-550" />
                    Uploaded: {formatDate(doc.uploadDate)}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold"
                  >
                    View Document File
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Patient Self Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" />
                Upload Health Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-450 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Health Checkup Report May 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500 placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Document Type Category *
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="BLOOD_TEST">Blood Test Report</option>
                  <option value="X_RAY">Chest X-Ray Scan</option>
                  <option value="MRI">MRI Scan</option>
                  <option value="CT_SCAN">CT Scan</option>
                  <option value="OTHER">Other Health Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select File attachment *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-450 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Supported: PDF, Images (Max: 5MB)</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  {uploadLoading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientRecordsPage;
