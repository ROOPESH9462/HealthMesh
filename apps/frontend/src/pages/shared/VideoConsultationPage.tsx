import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { connectSocket, disconnectSocket } from '../../services/socket';
import api from '../../services/api';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Send, 
  MessageSquare, 
  Clock, 
  User
} from 'lucide-react';

interface ChatMessage {
  senderName: string;
  text: string;
  timestamp: string;
}

interface VideoConsultationPageProps {
  role: 'DOCTOR' | 'PATIENT';
}

const VideoConsultationPage: React.FC<VideoConsultationPageProps> = ({ role }) => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || '';
  const navigate = useNavigate();
  
  const { user } = useAppSelector((state) => state.auth);
  
  // Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Call metadata states
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('Connecting...');
  
  // Chat sidebar states
  const chatOpen = true;
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Ref handles
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);

  // STUN servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 1. Initialize timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize Media & Sockets
  useEffect(() => {
    if (!appointmentId || !user) {
      alert('Missing call session parameters.');
      navigate('/');
      return;
    }

    const token = localStorage.getItem('token') || '';
    const socketInstance = connectSocket(token);
    socketRef.current = socketInstance;

    // Fetch existing chat logs and confirm status
    const initSession = async () => {
      try {
        // Start consultation in DB if doctor
        if (role === 'DOCTOR') {
          await api.post('/consultations/start', { appointmentId });
        }
        
        const res = await api.get(`/consultations/${appointmentId}`);
        setChatMessages(res.data.data.messages || []);
      } catch (err: any) {
        console.warn('Consultation session log init skipped:', err.message);
      }
    };

    initSession();

    // Request local camera and microphone stream
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Notify socket signaling
        socketInstance.emit('join-consultation-room', { appointmentId });
      } catch (err: any) {
        logger_warn('Camera not found. Falling back to mock audio/avatar stream.');
        // Enable mock signaling join anyway
        socketInstance.emit('join-consultation-room', { appointmentId });
        setConnectionState('Mock Camera Connected');
      }
    };

    initLocalMedia();

    // Register signaling handshake listeners
    socketInstance.on('participant-joined', async () => {
      logger_info('Remote peer joined consultation room. Creating offer...');
      setConnectionState('Connecting peer...');
      await createPeerConnection(socketInstance);
      
      try {
        const offer = await peerConnectionRef.current?.createOffer();
        await peerConnectionRef.current?.setLocalDescription(offer);
        socketInstance.emit('webrtc-offer', { appointmentId, offer });
      } catch (e) {
        console.error('Failed to create offer:', e);
      }
    });

    socketInstance.on('webrtc-offer', async ({ offer }) => {
      logger_info('Received SDP offer from peer. Creating answer...');
      await createPeerConnection(socketInstance);
      
      try {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer);
        socketInstance.emit('webrtc-answer', { appointmentId, answer });
        setConnectionState('Connected');
      } catch (e) {
        console.error('Failed to create answer:', e);
      }
    });

    socketInstance.on('webrtc-answer', async ({ answer }) => {
      logger_info('Received SDP answer from peer.');
      try {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setConnectionState('Connected');
      } catch (e) {
        console.error('Failed to set remote answer:', e);
      }
    });

    socketInstance.on('webrtc-ice-candidate', async ({ candidate }) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Failed to add ICE candidate:', e);
      }
    });

    socketInstance.on('chat-message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socketInstance.on('consultation-ended', () => {
      alert('Consultation has been terminated by the physician.');
      cleanUpCall();
      navigate(role === 'DOCTOR' ? '/doctor' : '/patient');
    });

    return () => {
      cleanUpCall();
    };
  }, [appointmentId]);

  const logger_info = (msg: string) => console.log(`[WebRTC Info]: ${msg}`);
  const logger_warn = (msg: string) => console.warn(`[WebRTC Warning]: ${msg}`);

  const createPeerConnection = async (socketInstance: any) => {
    if (peerConnectionRef.current) return;

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Attach local streams
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Capture remote streams
    pc.ontrack = (event) => {
      logger_info('Received remote media stream tracks.');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // Forward ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketInstance.emit('webrtc-ice-candidate', {
          appointmentId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      logger_info(`WebRTC Connection state updated: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionState('Connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setConnectionState('Disconnected');
      }
    };
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      appointmentId,
      text: chatInput,
      senderName: `${user?.firstName || 'User'} ${user?.lastName || ''}`
    });
    setChatInput('');
  };

  const handleEndCall = async () => {
    if (!window.confirm('Are you sure you want to end this consultation session call?')) return;

    if (role === 'DOCTOR') {
      try {
        // Post end call to backend
        await api.post('/consultations/end', { appointmentId, notes: 'Completed video consultation session.' });
      } catch (err: any) {
        console.error('Failed to register end session details:', err.message);
      }

      // Notify peer to disconnect
      if (socketRef.current) {
        socketRef.current.emit('end-consultation-call', { appointmentId });
      }
      
      cleanUpCall();
      // Redirect doctor directly to prescribing!
      navigate(`/doctor/prescribe?appointmentId=${appointmentId}`);
    } else {
      cleanUpCall();
      navigate('/patient');
    }
  };

  const cleanUpCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    disconnectSocket();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row h-[85vh] bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden text-slate-100 font-sans">
      
      {/* Left Column: Video Feeds */}
      <div className="flex-1 flex flex-col relative bg-slate-900/60">
        
        {/* Top Floating bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-slate-950/80 backdrop-blur border border-slate-850 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white uppercase tracking-wider">{connectionState}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/15">
            <Clock className="w-4 h-4" />
            {formatTimer(callDuration)}
          </div>
        </div>

        {/* Remote Video Container */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-950">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center space-y-2 opacity-50">
              <User className="w-16 h-16 mx-auto text-slate-700" />
              <p className="text-xs font-semibold">Waiting for patient to join...</p>
            </div>
          )}

          {/* Picture in Picture Local Video */}
          <div className="absolute bottom-4 right-4 w-32 md:w-44 aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-10">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-[10px] text-slate-500 font-semibold uppercase">
                Mock Cam Active
              </div>
            )}
          </div>
        </div>

        {/* Toolbar Overlay */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 flex justify-center items-center gap-4 z-20">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full border transition-all ${
              audioEnabled 
                ? 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-350' 
                : 'bg-rose-500/20 border-rose-500/30 text-rose-455 hover:bg-rose-500/30'
            }`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full border transition-all ${
              videoEnabled 
                ? 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-350' 
                : 'bg-rose-500/20 border-rose-500/30 text-rose-455 hover:bg-rose-500/30'
            }`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/10 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Right Column: Chat Sidebar */}
      {chatOpen && (
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-900 flex flex-col bg-slate-900/30 shrink-0">
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/20">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Live Consultation Chat
            </h3>
            <span className="text-[10px] text-slate-500">{chatMessages.length} texts</span>
          </div>

          {/* Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-550 text-xs my-auto">
                No messages exchanged during call session
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-0.5 max-w-[90%]">
                  <span className="font-bold text-[10px] text-slate-400 block">{msg.senderName}</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 flex gap-1.5 bg-slate-950/45">
            <input
              type="text"
              required
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message here..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default VideoConsultationPage;
