import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// Shared layout shell
// ─────────────────────────────────────────────
function Shell({ user, logout, navigate, children, activeTab, setActiveTab, tabs }) {
  const roleColor = { admin: '#ff3d71', teacher: '#00d4ff', student: '#00e676' }[user?.role] || '#7a93c0';
  const roleIcon  = { admin: '🛡', teacher: '👨‍🏫', student: '👨‍🎓' }[user?.role];

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top nav */}
      <nav className="h-16 bg-surface border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
        <a href="/" className="text-xl font-black gradient-text tracking-tight shrink-0">◈ EduLive</a>
        <div className="flex-1" />
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm font-semibold hover:bg-danger/20 transition-colors">
            ⚙️ Admin Panel
          </button>
        )}
        <div className="flex items-center gap-2.5 bg-elevated border border-border rounded-xl px-3 py-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
               style={{ background: 'linear-gradient(135deg,#2979ff,#00d4ff)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-textBase text-sm font-semibold leading-tight">{user?.name}</p>
            <p className="text-xs font-semibold capitalize" style={{ color: roleColor }}>
              {roleIcon} {user?.role}
            </p>
          </div>
        </div>
        <button onClick={logout}
          className="px-4 py-2 border border-border rounded-lg text-textDim text-sm font-medium hover:border-borderLight hover:text-textBase transition-colors">
          Logout
        </button>
      </nav>

      {/* Sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0 py-4 px-3 gap-1">
          {tabs.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                activeTab === id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-textDim hover:bg-elevated hover:text-textBase'
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}

          {/* User card at bottom */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="px-3 py-3 rounded-xl bg-elevated border border-border">
              <p className="text-textBase text-xs font-bold truncate">{user?.name}</p>
              <p className="text-xs capitalize mt-0.5 font-semibold" style={{ color: roleColor }}>
                {roleIcon} {user?.role}
              </p>
              <p className="text-textMuted text-[10px] mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-bg">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({ icon, value, label, color = '#2979ff', sub }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
             style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        {sub && <span className="text-textMuted text-xs bg-elevated border border-border rounded-lg px-2 py-1">{sub}</span>}
      </div>
      <div>
        <p className="text-3xl font-black text-textBase">{value}</p>
        <p className="text-textDim text-sm mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────
function CopyBtn({ value }) {
  const [c, setC] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setC(true); setTimeout(() => setC(false), 1600); }}
      className={`px-2 py-1 rounded text-[11px] border font-semibold transition-all ${c ? 'text-success border-success/40 bg-success/10' : 'text-textMuted border-border hover:border-borderLight hover:text-textDim'}`}>
      {c ? '✓' : '⎘'}
    </button>
  );
}

// ─────────────────────────────────────────────
// TEACHER DASHBOARD
// ─────────────────────────────────────────────
function TeacherOverview({ navigate }) {
  const [rooms,       setRooms]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/rooms/all').catch(() => ({ data: { rooms: [] } })),
      api.get('/assignments/teacher/all').catch(() => ({ data: { assignments: [] } })),
    ]).then(([r, a]) => {
      setRooms(r.data.rooms || []);
      setAssignments(a.data.assignments || []);
    }).finally(() => setLoading(false));
  }, []);

  const activeRooms = rooms.filter(r => r.isActive);
  const totalSubs   = assignments.reduce((s, a) => s + (a.submissions?.length || 0), 0);

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">Overview</h1>
        <p className="text-textDim text-sm mt-1">Here's what's happening in your classrooms.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏫" value={rooms.length}       label="Total Rooms"      color="#2979ff" />
        <StatCard icon="🟢" value={activeRooms.length} label="Active Sessions"  color="#00e676" />
        <StatCard icon="📋" value={assignments.length} label="Assignments"      color="#ffb300" />
        <StatCard icon="📤" value={totalSubs}          label="Submissions"      color="#00d4ff" />
      </div>

      {/* Recent rooms */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-textBase font-bold">Recent Classrooms</h2>
          <span className="text-textMuted text-xs">{rooms.length} total</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : rooms.length === 0 ? (
          <p className="text-center text-textMuted py-10 text-sm">No classrooms yet. Create your first one!</p>
        ) : (
          <div className="divide-y divide-border/50">
            {rooms.slice(0, 6).map(r => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-elevated/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-base shrink-0">🏫</div>
                <div className="flex-1 min-w-0">
                  <p className="text-textBase text-sm font-semibold truncate">{r.name}</p>
                  <p className="text-textMuted text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-accent text-xs tracking-wider bg-accent/10 border border-accent/20 px-2 py-1 rounded-lg">{r.roomId}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.isActive ? 'bg-success/10 text-success' : 'bg-textMuted/10 text-textMuted'}`}>
                    {r.isActive ? '● Live' : '○ Ended'}
                  </span>
                  {r.isActive && (
                    <button onClick={() => navigate(`/classroom/${r.roomId}`)}
                      className="px-3 py-1.5 bg-primary rounded-lg text-white text-xs font-bold hover:bg-primary/85 transition-colors">
                      Enter →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherCreateRoom({ navigate }) {
  const [roomName,    setRoomName]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);
  const { user }                      = useAuth();

  const create = async () => {
    if (!roomName.trim()) { toast.error('Enter a classroom name'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/rooms', { name: roomName.trim() });
      setCreatedRoom(data.room);
      toast.success('Classroom created! Email sent 📧');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-black text-textBase mb-1">Create Classroom</h1>
      <p className="text-textDim text-sm mb-6">Generate a new secure virtual classroom with a unique Room ID and password.</p>

      {!createdRoom ? (
        <div className="max-w-lg">
          <div className="card p-7 flex flex-col gap-5">
            <div>
              <label className="text-textDim text-xs font-bold uppercase tracking-widest block mb-2">Classroom Name</label>
              <input className="input-field" placeholder="e.g. Physics 101 – Section A"
                value={roomName} onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()} />
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-textDim text-sm leading-relaxed">
              💡 A <strong className="text-textBase">Room ID</strong> and <strong className="text-textBase">Password</strong> will be auto-generated.
              You'll also receive an email with the credentials.
            </div>
            <button onClick={create} disabled={loading} className="btn-primary py-3.5 text-base shadow-glow">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</span>
                : '🏫 Generate Classroom →'}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-lg animate-scale-in">
          <div className="card p-7 flex flex-col gap-4">
            <div className="text-center p-5 bg-success/10 border border-success/30 rounded-xl">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-success font-bold text-lg">Classroom Created!</p>
              <p className="text-textDim text-sm mt-1">Email sent to <strong className="text-textBase">{user?.email}</strong></p>
            </div>

            {[['Classroom Name', createdRoom.name, false], ['Room ID', createdRoom.roomId, true], ['Password', createdRoom.password, true]].map(([label, val, mono]) => (
              <div key={label} className="flex items-center gap-3 bg-elevated border border-border rounded-xl px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-textMuted text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                  <p className={`text-textBase font-bold truncate ${mono ? 'font-mono text-xl tracking-widest' : 'text-base'}`}>{val}</p>
                </div>
                <CopyBtn value={val} />
              </div>
            ))}

            <div className="flex gap-3 mt-1">
              <button onClick={() => { setCreatedRoom(null); setRoomName(''); }} className="btn-ghost flex-1 py-3 text-sm">Create Another</button>
              <button onClick={() => navigate(`/classroom/${createdRoom.roomId}`)} className="btn-primary flex-[2] py-3 text-sm shadow-glow">
                Enter Classroom →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherAssignments() {
  const [rooms,       setRooms]       = useState([]);
  const [selRoom,     setSelRoom]     = useState('');
  const [assignments, setAssignments] = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [title,       setTitle]       = useState('');
  const [desc,        setDesc]        = useState('');
  const [deadline,    setDeadline]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(false);

  useEffect(() => {
    api.get('/rooms/all').catch(() => ({ data: { rooms: [] } }))
      .then(({ data }) => {
        setRooms(data.rooms || []);
        if (data.rooms?.length > 0) setSelRoom(data.rooms[0].roomId);
      });
  }, []);

  useEffect(() => {
    if (!selRoom) return;
    setFetching(true);
    api.get(`/assignments/${selRoom}`)
      .then(({ data }) => setAssignments(data.assignments || []))
      .catch(() => setAssignments([]))
      .finally(() => setFetching(false));
  }, [selRoom]);

  const post = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    if (!selRoom)      { toast.error('Select a classroom'); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/assignments/${selRoom}`, {
        title: title.trim(), description: desc.trim(), deadline: deadline || undefined,
      });
      setAssignments(prev => [data.assignment, ...prev]);
      setTitle(''); setDesc(''); setDeadline(''); setShowForm(false);
      toast.success('Assignment posted!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-textBase">Assignments</h1>
          <p className="text-textDim text-sm mt-1">Create and manage assignments for your classrooms.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className={`shrink-0 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${showForm ? 'bg-elevated border-border text-textDim' : 'bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-glow'}`}>
          {showForm ? '✕ Cancel' : '+ New Assignment'}
        </button>
      </div>

      {/* Room selector */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-textDim text-sm font-semibold shrink-0">Classroom:</label>
          <div className="flex gap-2 flex-wrap">
            {rooms.map(r => (
              <button key={r.roomId} onClick={() => setSelRoom(r.roomId)}
                className={`px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all ${selRoom === r.roomId ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-textDim hover:border-borderLight'}`}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card p-6 flex flex-col gap-4 animate-slide-up max-w-2xl">
          <h2 className="text-textBase font-bold">New Assignment</h2>
          <div>
            <label className="text-textDim text-xs font-bold uppercase tracking-widest block mb-2">Title *</label>
            <input className="input-field text-sm" placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-textDim text-xs font-bold uppercase tracking-widest block mb-2">Instructions</label>
            <textarea rows={3} className="input-field text-sm resize-none" placeholder="Describe what students need to do…"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <label className="text-textDim text-xs font-bold uppercase tracking-widest block mb-2">Deadline</label>
            <input type="datetime-local" className="input-field text-sm" value={deadline} onChange={e => setDeadline(e.target.value)}
              style={{ colorScheme: 'dark' }} />
          </div>
          <button onClick={post} disabled={loading} className="btn-primary py-3 text-sm shadow-glow w-fit px-8">
            {loading ? 'Posting…' : '📋 Post Assignment'}
          </button>
        </div>
      )}

      {/* Assignment list */}
      {fetching ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-textBase font-bold mb-1">No Assignments Yet</p>
          <p className="text-textDim text-sm">Click "+ New Assignment" to post one for your students.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => (
            <div key={a._id} className="card p-5 hover:border-borderLight transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-textBase font-bold">{a.title}</h3>
                  {a.description && <p className="text-textDim text-sm mt-1 leading-relaxed">{a.description}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    {a.submissions?.length || 0} submissions
                  </span>
                </div>
              </div>
              {a.deadline && (
                <p className="text-warning text-xs flex items-center gap-1.5 mt-2">
                  ⏰ Due: {new Date(a.deadline).toLocaleString()}
                </p>
              )}
              {/* Submissions list */}
              {a.submissions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-textMuted text-xs font-bold uppercase tracking-widest mb-3">Student Submissions</p>
                  <div className="flex flex-col gap-2">
                    {a.submissions.map(s => (
                      <div key={s._id} className="flex items-center gap-3 bg-elevated border border-border rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-xs font-bold text-success">
                          {s.student?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-textBase text-xs font-semibold">{s.student?.name || 'Unknown'}</p>
                          <p className="text-textMuted text-[10px] truncate">📎 {s.fileName}</p>
                        </div>
                        <span className="text-success text-[10px] font-bold">✓ Submitted</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherRooms({ navigate }) {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rooms/all').then(({ data }) => setRooms(data.rooms || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-textBase">My Classrooms</h1>
          <p className="text-textDim text-sm mt-1">{rooms.length} classroom{rooms.length !== 1 ? 's' : ''} created</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : rooms.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <p className="text-textBase font-bold mb-1">No Classrooms Yet</p>
          <p className="text-textDim text-sm">Create your first virtual classroom to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map(r => (
            <div key={r._id} className="card p-5 hover:border-borderLight transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-xl shrink-0">🏫</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-textBase font-bold truncate">{r.name}</h3>
                  <p className="text-textMuted text-xs mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-lg px-2.5 py-1.5">
                    <span className="text-textMuted text-[10px] uppercase tracking-widest">ID:</span>
                    <span className="font-mono text-accent text-sm font-bold tracking-wider">{r.roomId}</span>
                    <CopyBtn value={r.roomId} />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${r.isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-elevated text-textMuted border border-border'}`}>
                    {r.isActive ? '● Live' : '○ Ended'}
                  </span>
                  {r.isActive && (
                    <button onClick={() => navigate(`/classroom/${r.roomId}`)}
                      className="btn-primary px-4 py-1.5 text-sm shadow-glow">
                      Enter →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────
function StudentOverview({ navigate }) {
  const [assignments, setAssignments] = useState([]);
  useEffect(() => {
    api.get('/assignments/student/all').catch(() => ({ data: { assignments: [] } }))
      .then(({ data }) => setAssignments(data.assignments || []));
  }, []);
  const pending  = assignments.filter(a => !a.mySubmission);
  const submitted = assignments.filter(a => a.mySubmission);

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">My Dashboard</h1>
        <p className="text-textDim text-sm mt-1">Welcome back! Here's your activity summary.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="📋" value={assignments.length} label="Total Assignments" color="#2979ff" />
        <StatCard icon="⏳" value={pending.length}     label="Pending"           color="#ffb300" />
        <StatCard icon="✅" value={submitted.length}   label="Submitted"         color="#00e676" />
      </div>

      {/* Quick join */}
      <div className="card p-6">
        <h2 className="text-textBase font-bold mb-4">Quick Join Classroom</h2>
        <QuickJoin navigate={navigate} />
      </div>

      {/* Pending assignments */}
      {pending.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-textBase font-bold">Pending Assignments</h2>
          </div>
          <div className="divide-y divide-border/50">
            {pending.slice(0, 4).map(a => (
              <div key={a._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center text-base shrink-0">📋</div>
                <div className="flex-1 min-w-0">
                  <p className="text-textBase text-sm font-semibold truncate">{a.title}</p>
                  <p className="text-textMuted text-xs">{a.roomName || 'Classroom'}</p>
                </div>
                {a.deadline && (
                  <span className="text-warning text-xs font-semibold shrink-0">
                    ⏰ {new Date(a.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickJoin({ navigate }) {
  const [joinId,   setJoinId]   = useState('');
  const [joinPass, setJoinPass] = useState('');
  const [loading,  setLoading]  = useState(false);

  const join = async () => {
    if (!joinId.trim() || !joinPass.trim()) { toast.error('Enter Room ID and Password'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/rooms/join', { roomId: joinId.trim().toUpperCase(), password: joinPass.trim() });
      navigate(`/classroom/${data.room.roomId}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <input className="input-field flex-1 min-w-[140px] font-mono tracking-widest text-sm py-2.5"
        placeholder="Room ID" value={joinId} onChange={e => setJoinId(e.target.value)} />
      <input className="input-field flex-1 min-w-[140px] text-sm py-2.5"
        type="password" placeholder="Password" value={joinPass} onChange={e => setJoinPass(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && join()} />
      <button onClick={join} disabled={loading} className="btn-primary px-6 py-2.5 text-sm shadow-glow shrink-0">
        {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Join →'}
      </button>
    </div>
  );
}

function StudentJoin({ navigate }) {
  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-black text-textBase mb-1">Join Classroom</h1>
      <p className="text-textDim text-sm mb-6">Enter the Room ID and Password provided by your teacher.</p>
      <div className="max-w-lg">
        <div className="card p-7">
          <QuickJoin navigate={navigate} />
          <div className="mt-5 pt-5 border-t border-border p-4 bg-elevated/50 rounded-xl">
            <p className="text-textDim text-sm leading-relaxed">
              📌 <strong className="text-textBase">How to get credentials?</strong><br />
              Ask your teacher for the <span className="text-accent font-mono font-bold">Room ID</span> and <span className="text-accent font-semibold">Password</span> for your class.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentAssignments({ navigate }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get('/assignments/student/all').catch(() => ({ data: { assignments: [] } }))
      .then(({ data }) => setAssignments(data.assignments || []))
      .finally(() => setLoading(false));
  }, []);

  const submitFile = async (assignmentId, roomId, file) => {
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post(`/assignments/${assignmentId}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Submitted! ✅');
      // Refetch
      api.get('/assignments/student/all').then(({ data }) => setAssignments(data.assignments || []));
    } catch (e) { toast.error(e.response?.data?.message || 'Submission failed'); }
  };

  const getMySubmission = (a) =>
    a.submissions?.find(s => s.student?._id === user?._id || s.student === user?._id);

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">My Assignments</h1>
        <p className="text-textDim text-sm mt-1">View and submit assignments from your teachers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-textBase font-bold mb-1">No Assignments Yet</p>
          <p className="text-textDim text-sm">Join a classroom — your teacher's assignments will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => {
            const sub = getMySubmission(a);
            const overdue = a.deadline && new Date(a.deadline) < new Date() && !sub;
            return (
              <div key={a._id} className={`card p-5 transition-colors ${overdue ? 'border-danger/30' : 'hover:border-borderLight'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${sub ? 'bg-success/15 border border-success/30' : overdue ? 'bg-danger/15 border border-danger/30' : 'bg-warning/15 border border-warning/30'}`}>
                    {sub ? '✅' : overdue ? '⚠️' : '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="text-textBase font-bold">{a.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${sub ? 'bg-success/10 text-success border border-success/20' : overdue ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                        {sub ? '✓ Submitted' : overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    {a.description && <p className="text-textDim text-sm mt-1 leading-relaxed">{a.description}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-textMuted text-xs">📚 {a.roomName || 'Classroom'}</span>
                      {a.deadline && (
                        <span className={`text-xs flex items-center gap-1 ${overdue && !sub ? 'text-danger' : 'text-warning'}`}>
                          ⏰ Due: {new Date(a.deadline).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {sub ? (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg w-fit">
                        <span className="text-success text-xs">✓ Submitted:</span>
                        <span className="text-success text-xs font-bold">{sub.fileName}</span>
                      </div>
                    ) : (
                      <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg cursor-pointer text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                        📎 Submit File
                        <input type="file" className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
                          onChange={e => e.target.files[0] && submitFile(a._id, a.roomId, e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const teacherTabs = [
    { id: 'overview',    icon: '📊', label: 'Overview'    },
    { id: 'create',      icon: '➕', label: 'Create Room' },
    { id: 'rooms',       icon: '🏫', label: 'My Rooms'   },
    { id: 'assignments', icon: '📋', label: 'Assignments' },
  ];
  const studentTabs = [
    { id: 'overview',    icon: '📊', label: 'Overview'    },
    { id: 'join',        icon: '🚪', label: 'Join Class'  },
    { id: 'assignments', icon: '📋', label: 'Assignments' },
  ];

  const tabs = isTeacher ? teacherTabs : studentTabs;
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Shell user={user} logout={logout} navigate={navigate} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {isTeacher ? (
        <>
          {activeTab === 'overview'    && <TeacherOverview    navigate={navigate} />}
          {activeTab === 'create'      && <TeacherCreateRoom  navigate={navigate} />}
          {activeTab === 'rooms'       && <TeacherRooms       navigate={navigate} />}
          {activeTab === 'assignments' && <TeacherAssignments />}
        </>
      ) : (
        <>
          {activeTab === 'overview'    && <StudentOverview    navigate={navigate} />}
          {activeTab === 'join'        && <StudentJoin        navigate={navigate} />}
          {activeTab === 'assignments' && <StudentAssignments navigate={navigate} />}
        </>
      )}
    </Shell>
  );
}
