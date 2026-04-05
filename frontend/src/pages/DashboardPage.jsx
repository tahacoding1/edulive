import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={copy}
      className={`px-2.5 py-1 text-xs border rounded-md font-medium transition-all ${copied ? 'border-success/50 text-success bg-success/10' : 'border-border text-textDim hover:border-borderLight'}`}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CredRow({ label, value, mono }) {
  return (
    <div className="bg-elevated border border-border rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-textMuted text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-textBase font-bold truncate ${mono ? 'font-mono text-xl tracking-wider' : 'text-base'}`}>{value}</p>
      </div>
      <CopyBtn value={value} />
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [tab, setTab]               = useState(isTeacher ? 'create' : 'join');
  const [roomName, setRoomName]     = useState('');
  const [joinId, setJoinId]         = useState('');
  const [joinPass, setJoinPass]     = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [loading, setLoading]       = useState(false);

  const createRoom = async () => {
    if (!roomName.trim()) { toast.error('Please enter a classroom name.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/rooms', { name: roomName.trim() });
      setCreatedRoom(data.room);
      toast.success('Classroom created! Email sent to your inbox 📧');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create room.'); }
    finally { setLoading(false); }
  };

  const joinRoom = async () => {
    if (!joinId.trim() || !joinPass.trim()) { toast.error('Enter both Room ID and Password.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/rooms/join', { roomId: joinId.trim().toUpperCase(), password: joinPass.trim() });
      navigate(`/classroom/${data.room.roomId}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  const roleColor = user?.role === 'admin' ? 'text-danger' : user?.role === 'teacher' ? 'text-accent' : 'text-success';

  return (
    <div className="min-h-screen bg-bg bg-grid flex flex-col font-sans">
      {/* Navbar */}
      <nav className="h-16 bg-surface border-b border-border flex items-center px-7 gap-4 shrink-0 sticky top-0 z-20">
        <a href="/" className="text-xl font-black gradient-text tracking-tight">◈ EduLive</a>
        <div className="flex-1" />
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-danger/10 border border-danger/40 rounded-lg text-danger text-sm font-semibold hover:bg-danger/20 transition-colors">
            ⚙️ Admin Panel
          </button>
        )}
        <div className="flex items-center gap-2.5 bg-elevated rounded-full px-3 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
               style={{ background: 'linear-gradient(135deg,#2979ff,#00d4ff)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-textBase text-sm font-semibold leading-tight">{user?.name}</p>
            <p className={`text-xs capitalize font-semibold ${roleColor}`}>{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost px-4 py-2 text-sm">Logout</button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-lg">
          <div className="mb-9">
            <h1 className="text-4xl font-black text-textBase tracking-tight mb-2">
              Welcome, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-textDim text-base">
              {isTeacher ? 'Create and manage your virtual classrooms.' : 'Join your classroom with credentials from your teacher.'}
            </p>
          </div>

          {isTeacher && (
            <div className="flex gap-2 mb-6">
              {[['create','＋ Create Room'],['join','Join as Guest']].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setCreatedRoom(null); }}
                  className={`tab-btn ${tab === t ? 'active' : 'inactive'}`}>{label}</button>
              ))}
            </div>
          )}

          <div className="card p-9 shadow-card animate-scale-in">
            {/* CREATE */}
            {tab === 'create' && !createdRoom && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-textBase mb-1">Create a Classroom</h2>
                  <p className="text-textDim text-sm">A unique Room ID and secure password will be auto-generated. You'll also receive an email with the details.</p>
                </div>
                <input className="input-field" placeholder="Classroom Name (e.g. Physics 101 – Section A)"
                  value={roomName} onChange={e => setRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createRoom()} />
                <button onClick={createRoom} disabled={loading} className="btn-primary py-3.5 text-base shadow-glow">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</span> : 'Generate Room →'}
                </button>
              </div>
            )}

            {/* ROOM CREATED */}
            {tab === 'create' && createdRoom && (
              <div className="flex flex-col gap-4 animate-slide-up">
                <div className="text-center p-4 bg-success/10 border border-success/30 rounded-xl">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-success font-bold">Room Created! Email sent to {user?.email}</p>
                  <p className="text-textDim text-xs mt-1">Share these credentials with your students</p>
                </div>
                <CredRow label="Room Name" value={createdRoom.name}     mono={false} />
                <CredRow label="Room ID"   value={createdRoom.roomId}   mono={true}  />
                <CredRow label="Password"  value={createdRoom.password} mono={true}  />
                <div className="flex gap-2.5 mt-1">
                  <button onClick={() => { setCreatedRoom(null); setRoomName(''); }} className="btn-ghost flex-1 py-3 text-sm">New Room</button>
                  <button onClick={() => navigate(`/classroom/${createdRoom.roomId}`)} className="btn-primary flex-[2] py-3 text-sm shadow-glow">
                    Enter Classroom →
                  </button>
                </div>
              </div>
            )}

            {/* JOIN */}
            {(tab === 'join' || !isTeacher) && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-textBase mb-1">Join a Classroom</h2>
                  <p className="text-textDim text-sm">Enter the Room ID and Password provided by your teacher.</p>
                </div>
                <input className="input-field font-mono text-lg tracking-wider" placeholder="Room ID  (e.g. ABC-XYZ)"
                  value={joinId} onChange={e => setJoinId(e.target.value)} />
                <input className="input-field" type="password" placeholder="Room Password"
                  value={joinPass} onChange={e => setJoinPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()} />
                <button onClick={joinRoom} disabled={loading} className="btn-primary py-3.5 text-base shadow-glow">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Joining…</span> : 'Join Classroom →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
