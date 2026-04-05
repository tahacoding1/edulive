import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket, initSocket } from '../utils/socket';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../utils/api';
import toast from 'react-hot-toast';

import Whiteboard        from '../components/classroom/Whiteboard';
import VideoCallPanel    from '../components/classroom/VideoCallPanel';
import ChatPanel         from '../components/classroom/ChatPanel';
import ParticipantsPanel from '../components/classroom/ParticipantsPanel';
import AssignmentsPanel  from '../components/classroom/AssignmentsPanel';

function CopyBtn({ value, label }) {
  const [c, setC] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setC(true); setTimeout(() => setC(false), 1500); };
  return (
    <button onClick={copy} title={`Copy ${label}`}
      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono transition-all ${c ? 'text-success border-success/40' : 'text-textMuted border-border hover:border-borderLight'}`}>
      {c ? '✓' : '⎘'}
    </button>
  );
}

function CtrlBtn({ active, color = '#2979ff', icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-[11px] font-semibold transition-all min-w-[60px] active:scale-95"
      style={danger
        ? { background: 'rgba(255,61,113,0.1)', borderColor: 'rgba(255,61,113,0.4)', color: '#ff3d71' }
        : active
          ? { background: `${color}1a`, borderColor: color, color }
          : { background: 'transparent', borderColor: '#1c2d4f', color: '#7a93c0' }}>
      <span className="text-xl leading-none">{icon}</span>
      {label}
    </button>
  );
}

export default function ClassroomPage() {
  const { roomId }  = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const isTeacher   = user?.role === 'teacher' || user?.role === 'admin';

  const [room,         setRoom]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [participants, setParticipants] = useState([]);
  const [raisedHands,  setRaisedHands]  = useState([]);
  const [handRaised,   setHandRaised]   = useState(false);
  const [contentTab,   setContentTab]   = useState('whiteboard');
  const [sideTab,      setSideTab]      = useState('chat');
  const [showEndModal, setShowEndModal] = useState(false);
  const [showCreds,    setShowCreds]    = useState(false);
  const [notification, setNotification] = useState('');

  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }, []);

  // WebRTC
  const webrtc = useWebRTC({ roomId, user });

  // Load room + init socket
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}`);
        setRoom(data.room);
      } catch {
        toast.error('Room not found or access denied.');
        navigate('/dashboard'); return;
      }
      const token  = localStorage.getItem('token');
      const socket = initSocket(token);
      const emitJoin = () => socket.emit('join-room', { roomId });
      if (socket.connected) emitJoin();
      else socket.once('connect', emitJoin);
      setLoading(false);
    };
    load();
  }, [roomId, navigate]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const on = (ev, fn) => socket.on(ev, fn);
    const off = (ev, fn) => socket.off(ev, fn);

    const onState    = ({ participants: ps, raisedHands: rh }) => { setParticipants(ps); setRaisedHands(rh); };
    const onJoined   = ({ participants: ps, participant: p }) => { setParticipants(ps); notify(`${p.name} joined.`); };
    const onLeft     = ({ participants: ps, name }) => { setParticipants(ps); notify(`${name} left.`); };
    const onHand     = ({ raisedHands: rh }) => setRaisedHands(rh);
    const onSpeak    = ({ raisedHands: rh }) => { setRaisedHands(rh); notify('✅ Teacher allowed you to speak!'); };
    const onRemoved  = ({ participants: ps }) => setParticipants(ps);
    const onKicked   = ({ message: msg }) => { toast.error(msg); navigate('/dashboard'); };
    const onEnded    = ({ message: msg }) => { toast(msg, { icon: '📴' }); navigate('/dashboard'); };

    on('room-state',          onState);
    on('participant-joined',  onJoined);
    on('participant-left',    onLeft);
    on('hand-update',         onHand);
    on('speak-allowed',       onSpeak);
    on('participant-removed', onRemoved);
    on('kicked',              onKicked);
    on('room-ended',          onEnded);

    return () => {
      off('room-state',          onState);
      off('participant-joined',  onJoined);
      off('participant-left',    onLeft);
      off('hand-update',         onHand);
      off('speak-allowed',       onSpeak);
      off('participant-removed', onRemoved);
      off('kicked',              onKicked);
      off('room-ended',          onEnded);
    };
  }, [navigate, notify]);

  const raiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    getSocket()?.emit('raise-hand', { roomId, raised: next });
    notify(next ? '✋ Hand raised!' : 'Hand lowered.');
  };

  const handleLeave = async () => {
    webrtc.stopStream();
    if (isTeacher) {
      getSocket()?.emit('end-room', { roomId });
      await api.patch(`/rooms/${roomId}/end`).catch(() => {});
    }
    navigate('/dashboard');
  };

  // Start camera/mic via WebRTC
  const handleStartCamera = async () => {
    try {
      await webrtc.startStream(true, true);
      setContentTab('video');
      notify('📹 Camera started');
    } catch { toast.error('Camera/microphone access denied.'); }
  };

  const handleShareScreen = async () => {
    try {
      await webrtc.shareScreen();
      setContentTab('video');
      notify('🖥 Screen sharing started');
    } catch { toast.error('Screen sharing cancelled or denied.'); }
  };

  if (loading) return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-textDim text-sm">Joining classroom…</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-bg font-sans overflow-hidden">

      {/* Notification toast */}
      {notification && (
        <div className="notification-toast">{notification}</div>
      )}

      {/* ── HEADER ── */}
      <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-3 shrink-0 z-10">
        <span className="text-xl font-black gradient-text">◈</span>

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-danger/90 rounded px-2 py-0.5 shrink-0">
            <div className="live-dot" />
            <span className="text-white text-[10px] font-bold">LIVE</span>
          </div>
          <span className="text-textBase font-bold text-sm truncate">{room?.name}</span>
        </div>

        {/* Credentials chip — click to expand */}
        <button onClick={() => setShowCreds(s => !s)}
          className="hidden sm:flex items-center gap-2 bg-elevated border border-border rounded-lg px-3 py-1.5 hover:border-borderLight transition-all group">
          <span className="text-textMuted text-xs">Room ID:</span>
          <span className="text-textBase text-xs font-mono font-bold tracking-wider">{roomId}</span>
          <span className="text-textMuted text-[10px] group-hover:text-textDim">🔑</span>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 bg-elevated rounded-md px-3 py-1.5">
          <div className="online-dot" />
          <span className="text-textDim text-xs">{participants.length} online</span>
        </div>

        {raisedHands.length > 0 && isTeacher && (
          <button onClick={() => setSideTab('participants')}
            className="flex items-center gap-1.5 bg-warning/10 border border-warning/40 rounded-md px-3 py-1.5 hover:bg-warning/20 transition-colors">
            <span>✋</span>
            <span className="text-warning text-xs font-bold">{raisedHands.length}</span>
          </button>
        )}

        {isTeacher
          ? <button onClick={() => setShowEndModal(true)} className="btn-danger px-4 py-1.5 text-sm">End Session</button>
          : <button onClick={handleLeave} className="btn-ghost px-4 py-1.5 text-sm">Leave</button>
        }
      </header>

      {/* Credentials dropdown */}
      {showCreds && room && (
        <div className="bg-elevated border-b border-border px-4 py-3 flex items-center gap-6 animate-slide-down z-10">
          <span className="text-textDim text-xs font-semibold">Share with students:</span>
          {[['Room ID', room.roomId, true], ['Password', room.password, true]].map(([label, val, mono]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-textMuted text-xs uppercase tracking-wider">{label}:</span>
              <span className={`text-textBase font-bold text-sm ${mono ? 'font-mono tracking-widest' : ''}`}>{val}</span>
              <CopyBtn value={val} label={label} />
            </div>
          ))}
          <button onClick={() => setShowCreds(false)} className="ml-auto text-textMuted hover:text-textBase text-sm">✕</button>
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <div className="flex gap-1.5 px-3.5 py-2 bg-surface border-b border-border shrink-0">
            {[['whiteboard','🖊 Whiteboard'],['video','📹 Video Call']].map(([t, label]) => (
              <button key={t} onClick={() => setContentTab(t)}
                className={`tab-btn ${contentTab === t ? 'active' : 'inactive'}`}>{label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {contentTab === 'whiteboard' && <Whiteboard isTeacher={isTeacher} roomId={roomId} />}
            {contentTab === 'video' && (
              <VideoCallPanel
                localStream={webrtc.localStream}
                peers={webrtc.peers}
                user={user}
                micOn={webrtc.micOn}
                camOn={webrtc.camOn}
                isTeacher={isTeacher}
                onStartCamera={handleStartCamera}
                onShareScreen={handleShareScreen}
                onStop={webrtc.stopStream}
                onToggleMic={webrtc.toggleMic}
                onToggleCamera={webrtc.toggleCamera}
              />
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 xl:w-80 flex flex-col bg-surface shrink-0">
          <div className="flex border-b border-border shrink-0">
            {[['chat','💬 Chat'],['participants','👥 People'],['assignments','📋 Tasks']].map(([t, label]) => (
              <button key={t} onClick={() => setSideTab(t)}
                className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${sideTab === t ? 'border-primary text-textBase' : 'border-transparent text-textDim hover:text-textBase'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {sideTab === 'chat'         && <ChatPanel         user={user} roomId={roomId} />}
            {sideTab === 'participants' && <ParticipantsPanel user={user} participants={participants} raisedHands={raisedHands} roomId={roomId} />}
            {sideTab === 'assignments'  && <AssignmentsPanel  user={user} roomId={roomId} />}
          </div>
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div className="h-[74px] bg-surface border-t border-border flex items-center justify-center gap-2 px-5 shrink-0">
        <CtrlBtn active={webrtc.micOn} color="#2979ff"
          icon={webrtc.micOn ? '🎤' : '🔇'}
          label={webrtc.micOn ? 'Mic On' : 'Muted'}
          onClick={() => {
            if (webrtc.localStream) webrtc.toggleMic();
            else handleStartCamera();
          }} />

        <CtrlBtn active={webrtc.camOn} color="#2979ff"
          icon={webrtc.camOn ? '📹' : '📷'}
          label={webrtc.camOn ? 'Cam On' : 'Cam Off'}
          onClick={() => {
            if (webrtc.localStream) webrtc.toggleCamera();
            else handleStartCamera();
          }} />

        {!isTeacher && (
          <CtrlBtn active={handRaised} color="#ffb300"
            icon="✋" label={handRaised ? 'Lower' : 'Raise Hand'}
            onClick={raiseHand} />
        )}

        {isTeacher && (
          <CtrlBtn active={false} icon="🖥" label="Screen"
            onClick={handleShareScreen} />
        )}

        <button onClick={() => setShowCreds(s => !s)}
          className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border border-border text-[11px] font-semibold text-textDim hover:border-borderLight hover:text-textBase transition-all min-w-[60px]">
          <span className="text-xl">🔑</span>
          Credentials
        </button>

        <div className="flex-1" />
        <CtrlBtn danger icon="📴" label={isTeacher ? 'End' : 'Leave'}
          onClick={isTeacher ? () => setShowEndModal(true) : handleLeave} />
      </div>

      {/* End session modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-9 w-96 text-center shadow-card animate-scale-in">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-black text-textBase mb-2">End Session?</h2>
            <p className="text-textDim text-sm leading-relaxed mb-7">
              This will close <strong className="text-textBase">{room?.name}</strong> and disconnect all{' '}
              <strong className="text-textBase">{participants.length}</strong> participants.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)} className="btn-ghost flex-1 py-3 text-sm">Cancel</button>
              <button onClick={handleLeave} className="flex-1 py-3 bg-danger rounded-lg text-white text-sm font-bold hover:bg-danger/90 transition-colors">
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
