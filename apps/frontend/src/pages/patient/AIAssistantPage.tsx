import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Activity, 
  MessageSquare, 
  History, 
  AlertCircle, 
  Cpu, 
  Send,
  Loader2
} from 'lucide-react';
import { formatDate } from '@healthcare/shared-utils';

interface PredictionLog {
  id: string;
  modelName: string;
  modelVersion: string;
  confidence: number;
  executionTimeMs: number;
  prediction: string;
  status: string;
  createdAt: string;
}

interface DiseaseResult {
  disease: string;
  confidence: number;
  department: string;
  triage: string;
}

interface SymptomResponse {
  primary_suspect: string;
  confidence: number;
  triage: string;
  department: string;
  predictions: DiseaseResult[];
  recommendations: string[];
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const AIAssistantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'chat' | 'history'>('symptoms');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // TAB 1: Symptom Checker states
  const [symptomsInput, setSymptomsInput] = useState('');
  const [checkingSymptoms, setCheckingSymptoms] = useState(false);
  const [symptomResult, setSymptomResult] = useState<SymptomResponse | null>(null);

  // TAB 2: Chatbot states
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello! I am your AI Health Assistant. Ask me anything about diabetes, blood pressure, cholesterol, or general wellness.' }
  ]);

  // TAB 3: Inference logs state
  const [logs, setLogs] = useState<PredictionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchHistoryLogs = async () => {
    setLogsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/ai/predictions');
      setLogs(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load AI prediction history logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryLogs();
    }
  }, [activeTab]);

  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;

    setCheckingSymptoms(true);
    setErrorMsg(null);
    setSymptomResult(null);

    try {
      const res = await api.post('/ai/symptom-check', { symptoms: symptomsInput });
      setSymptomResult(res.data.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Symptom analysis failed.');
    } finally {
      setCheckingSymptoms(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessageText = chatInput;
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMessageText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { query: userMessageText });
      setChatHistory((prev) => [...prev, { sender: 'ai', text: res.data.data.response }]);
    } catch (err: any) {
      setChatHistory((prev) => [...prev, { sender: 'ai', text: 'Sorry, I encountered an issue processing that query. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getTriageBadge = (triage: string) => {
    switch (triage) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-450 border border-rose-500/15 uppercase">Critical Severity</span>;
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-455 border border-amber-500/15 uppercase">Urgent Review</span>;
      case 'STANDARD':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/15 uppercase">Standard Triage</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/15 uppercase">Non-Urgent</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          AI Diagnostic Assistant Console
        </h2>
        <p className="text-xs text-slate-400">Analyze symptoms, consult medical knowledge indexes, and review model outputs</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">System Notice</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-900 pb-1">
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'symptoms'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Symptom Checker
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          RAG Health Chatbot
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          AI Inference History
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'symptoms' ? (
        
        // TAB 1: Symptom Checker
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl h-fit space-y-4">
            <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider">Describe Symptoms</h3>
            
            <form onSubmit={handleSymptomSubmit} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={4}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="e.g. Experiencing sudden chest pain, pressure under sternum, and shortness of breath."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-700 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={checkingSymptoms}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors"
              >
                {checkingSymptoms ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running XGBoost Inference...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Check Symptoms
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            {!symptomResult ? (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-550 h-full min-h-[250px]">
                <Activity className="w-10 h-10 text-slate-800 mb-2" />
                <p className="text-xs font-semibold">Enter your symptoms on the left to analyze triage priority</p>
              </div>
            ) : (
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Primary Suspect: <span className="text-indigo-400">{symptomResult.primary_suspect}</span>
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-1 uppercase font-semibold">
                      Department: {symptomResult.department}
                    </p>
                  </div>
                  {getTriageBadge(symptomResult.triage)}
                </div>

                {/* Probability scores bar chart */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inference Probability Spectrum</h4>
                  <div className="space-y-3">
                    {symptomResult.predictions.map((p, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{p.disease}</span>
                          <span className="text-slate-450">{(p.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${p.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Triage recommendations */}
                {symptomResult.recommendations && (
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Clinical Action Advice</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400 leading-relaxed">
                      {symptomResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'chat' ? (
        
        // TAB 2: Chatbot Dialogue
        <div className="max-w-3xl mx-auto p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="h-[40vh] overflow-y-auto pr-2 space-y-3 flex flex-col">
            {chatHistory.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white self-end rounded-tr-none'
                    : 'bg-slate-950 border border-slate-850 text-slate-200 self-start rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-3 bg-slate-950 border border-slate-850 text-slate-500 text-xs self-start rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Retrieving guidelines...
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2 pt-3 border-t border-slate-800/80">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about normal blood pressure targets, diabetes guidelines..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        
        // TAB 3: History Logs
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-xs text-slate-350 uppercase tracking-wider">AI Inference Registry Logs</h3>
            <span className="text-[10px] text-slate-550">Tracks execution metrics and models output</span>
          </div>

          {logsLoading ? (
            <div className="text-center py-12 text-slate-550 text-sm">Querying database inference history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-550 text-xs">
              No clinical AI runs recorded in your profile history
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[55vh] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      Prediction: {log.prediction}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Model: {log.modelName} ({log.modelVersion}) • Duration: {log.executionTimeMs} ms
                    </p>
                    <p className="text-[9px] text-slate-550">
                      Timestamp: {formatDate(log.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-slate-400">
                      Confidence: {(log.confidence * 100).toFixed(0)}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      log.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        : 'bg-rose-500/10 text-rose-455 border border-rose-500/15'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AIAssistantPage;
