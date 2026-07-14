import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  Upload, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Layers,
  Calendar
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

interface MedicalDocument {
  id: string;
  patientId: string;
  patient?: {
    user?: {
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

const LabUploadPage: React.FC = () => {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form upload states
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [documentType, setDocumentType] = useState('BLOOD_TEST');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [docsRes, patientsRes] = await Promise.all([
        api.get('/lab'),
        api.get('/patients')
      ]);
      setDocuments(docsRes.data.data || []);
      setPatients(patientsRes.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load laboratory registers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !file || !title) {
      setErrorMsg('Please select a patient, enter a title, and attach a file.');
      return;
    }

    setUploadLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('patientId', selectedPatientId);
    formData.append('documentType', documentType);
    formData.append('title', title);
    formData.append('file', file);

    try {
      await api.post('/lab', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Laboratory report uploaded and queued for AI analysis.');
      // Refresh list
      fetchRecords();
      // Reset
      setSelectedPatientId('');
      setTitle('');
      setFile(null);
      // Clear file input element
      const fileInput = document.getElementById('report-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Upload failed. File type may be unsupported.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this laboratory report from storage?')) return;

    try {
      await api.delete(`/lab/${docId}`);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete laboratory record.');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-sky-400" />
          Laboratory Workstation Desk
        </h2>
        <p className="text-xs text-slate-400">File diagnostic logs, upload scan attachments, and query patient documents histories</p>
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

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Success</p>
            <p className="text-xs mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Upload Form */}
        <div className="lg:col-span-1 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl h-fit space-y-4">
          <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider border-b border-slate-800 pb-2">
            Upload Report Document
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Select Patient *
              </label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.user?.firstName} {pt.user?.lastName} ({pt.user?.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count Scan"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500 placeholder-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Category Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-sky-500"
                >
                  <option value="BLOOD_TEST">Blood Test</option>
                  <option value="X_RAY">Chest X-Ray</option>
                  <option value="MRI">MRI Scan</option>
                  <option value="CT_SCAN">CT Scan</option>
                  <option value="OTHER">Other Report</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Attach File Document *
              </label>
              <input
                id="report-file-input"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Supported: PDF, PNG, JPG (Max: 5MB)</span>
            </div>

            <button
              type="submit"
              disabled={uploadLoading}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-lg shadow-sky-500/10 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              {uploadLoading ? 'Uploading file...' : 'Upload & Queue Report'}
            </button>
          </form>
        </div>

        {/* Right: Master Reports Registry */}
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-sky-400" />
              Upload Logs Registry
            </h3>
            <span className="text-xs text-slate-500">{documents.length} files logged</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-550 text-sm">Querying document timeline...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 text-slate-550 text-xs">
              No files currently registered in the database
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div key={doc.id} className="py-4 flex justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Patient: {doc.patient?.user?.firstName} {doc.patient?.user?.lastName} • {doc.documentType}
                    </p>
                    <div className="flex gap-4 text-[10px] text-slate-550 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Uploaded: {formatDate(doc.uploadDate)}
                      </span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 font-bold"
                      >
                        View Attachment
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      doc.isVerifiedByDoctor
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                    }`}>
                      {doc.isVerifiedByDoctor ? 'Verified' : 'Pending Review'}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-rose-450 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LabUploadPage;
