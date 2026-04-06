import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Reuse same Shell pattern as DashboardPage ──
function Shell({ user, logout, navigate, children, activeTab, setActiveTab, tabs }) {
  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      <nav className="h-16 bg-surface border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
        <a href="/" className="text-xl font-black gradient-text tracking-tight shrink-0">◈ EduLive</a>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/30 rounded-lg">
          <span className="text-danger text-xs font-bold">⚙️ Admin Panel</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-border rounded-lg text-textDim text-sm hover:border-borderLight hover:text-textBase transition-colors">
          ← Dashboard
        </button>
        <div className="flex items-center gap-2.5 bg-elevated border border-border rounded-xl px-3 py-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
               style={{ background: 'linear-gradient(135deg,#ff3d71,#ff6d00)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-textBase text-sm font-semibold leading-tight">{user?.name}</p>
            <p className="text-danger text-xs font-bold">🛡 Admin</p>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2 border border-border rounded-lg text-textDim text-sm hover:border-borderLight transition-colors">
          Logout
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0 py-4 px-3 gap-1">
          {tabs.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === id
                  ? 'bg-danger/10 text-danger border border-danger/30'
                  : 'text-textDim hover:bg-elevated hover:text-textBase'
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="px-3 py-3 rounded-xl bg-elevated border border-border">
              <p className="text-textBase text-xs font-bold truncate">{user?.name}</p>
              <p className="text-danger text-xs mt-0.5 font-bold">🛡 Administrator</p>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color = '#2979ff' }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
           style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-textBase">{value}</p>
        <p className="text-textDim text-sm mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Dashboard overview ──
function AdminOverview({ setActiveTab }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const roleColors = { admin: '#ff3d71', teacher: '#00d4ff', student: '#00e676' };
  const roleIcons  = { admin: '🛡', teacher: '👨‍🏫', student: '👨‍🎓' };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">Admin Overview</h1>
        <p className="text-textDim text-sm mt-1">Platform statistics and quick actions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" value={stats?.users       ?? '…'} label="Total Users"   color="#2979ff" />
        <StatCard icon="🏫" value={stats?.rooms       ?? '…'} label="Total Rooms"   color="#00d4ff" />
        <StatCard icon="💬" value={stats?.messages    ?? '…'} label="Messages"      color="#00e676" />
        <StatCard icon="📋" value={stats?.assignments ?? '…'} label="Assignments"   color="#ffb300" />
      </div>

      {/* Role breakdown */}
      {stats?.roleBreakdown && (
        <div className="card p-6">
          <h2 className="text-textBase font-bold mb-5">Users by Role</h2>
          <div className="flex gap-4 flex-wrap">
            {stats.roleBreakdown.map(({ _id: role, count }) => (
              <div key={role} className="flex items-center gap-3 px-5 py-4 rounded-xl border"
                   style={{ background: `${roleColors[role]}12`, borderColor: `${roleColors[role]}30` }}>
                <span className="text-2xl">{roleIcons[role]}</span>
                <div>
                  <p className="text-2xl font-black" style={{ color: roleColors[role] }}>{count}</p>
                  <p className="text-xs capitalize text-textDim font-semibold">{role}s</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-textBase font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '👥', label: 'Manage Users',    tab: 'users',   color: '#2979ff' },
            { icon: '🏫', label: 'View Rooms',       tab: 'rooms',   color: '#00d4ff' },
            { icon: '✏️', label: 'Edit Website',     tab: 'content', color: '#00e676' },
          ].map(({ icon, label, tab, color }) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-3 p-4 card hover:border-borderLight transition-all text-left group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                   style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                {icon}
              </div>
              <span className="text-textDim text-sm font-semibold group-hover:text-textBase transition-colors">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users management ──
function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [roleF,   setRoleF]   = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 15;

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit: LIMIT, search, role: roleF } });
      setUsers(data.users); setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, search, roleF]);

  const updateRole = async (userId, role) => {
    try { await api.patch(`/admin/users/${userId}/role`, { role }); toast.success(`Role → ${role}`); fetch(); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (u) => {
    try { await api.patch(`/admin/users/${u._id}/toggle-active`); fetch(); toast.success(u.isActive ? 'Account disabled' : 'Account enabled'); }
    catch { toast.error('Failed'); }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete "${u.name}"?`)) return;
    try { await api.delete(`/admin/users/${u._id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const roleStyle = { admin: 'text-danger bg-danger/10 border-danger/30', teacher: 'text-accent bg-accent/10 border-accent/30', student: 'text-success bg-success/10 border-success/30' };

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">User Management</h1>
        <p className="text-textDim text-sm mt-1">Manage all registered users, assign roles, enable/disable accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input className="input-field flex-1 min-w-[200px] py-2.5 text-sm" placeholder="🔍 Search name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <div className="flex gap-1.5">
          {[['','All'],['student','Students'],['teacher','Teachers'],['admin','Admins']].map(([v, label]) => (
            <button key={v} onClick={() => { setRoleF(v); setPage(1); }}
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-bold transition-all ${roleF === v ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-textDim hover:border-borderLight'}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-textMuted text-sm px-3 py-2.5 bg-elevated border border-border rounded-lg">
          {total} users
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-textMuted py-14 text-sm">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-elevated/50">
                  {['User','Role','Status','Joined','Actions'].map(h => (
                    <th key={h} className="text-left text-textMuted text-[10px] font-bold uppercase tracking-widest px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-elevated/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                             style={{ background: 'linear-gradient(135deg,#2979ff,#00d4ff)' }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-textBase text-sm font-semibold">{u.name}</p>
                          <p className="text-textMuted text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select value={u.role} onChange={e => updateRole(u._id, e.target.value)}
                        className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 cursor-pointer bg-transparent outline-none transition-all capitalize ${roleStyle[u.role]}`}>
                        <option value="student">👨‍🎓 Student</option>
                        <option value="teacher">👨‍🏫 Teacher</option>
                        <option value="admin">🛡 Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-textMuted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(u)}
                          className={`px-3 py-1.5 text-xs border rounded-lg font-semibold transition-colors ${u.isActive ? 'border-warning/40 text-warning hover:bg-warning/10' : 'border-success/40 text-success hover:bg-success/10'}`}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => deleteUser(u)}
                          className="px-3 py-1.5 text-xs border border-danger/40 text-danger rounded-lg hover:bg-danger/10 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-textDim text-sm bg-elevated border border-border px-4 py-2 rounded-lg">
            Page {page} of {Math.ceil(total / LIMIT)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
            className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Rooms tab ──
function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/rooms').then(({ data }) => setRooms(data.rooms || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-textBase">All Classrooms</h1>
        <p className="text-textDim text-sm mt-1">{rooms.length} classrooms across all teachers.</p>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-elevated/50">
                  {['Classroom','Teacher','Room ID','Participants','Status','Created'].map(h => (
                    <th key={h} className="text-left text-textMuted text-[10px] font-bold uppercase tracking-widest px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r._id} className="border-b border-border/50 hover:bg-elevated/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-base shrink-0">🏫</div>
                        <span className="text-textBase text-sm font-semibold">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-textDim text-sm">{r.teacher?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-accent text-sm font-bold tracking-wider bg-accent/10 border border-accent/20 px-2 py-1 rounded-lg">{r.roomId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-textDim text-sm text-center">{r.participants?.length || 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-elevated text-textMuted border border-border'}`}>
                        {r.isActive ? '● Live' : '○ Ended'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-textMuted text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Content CMS ──
function AdminContent() {
  const [content, setContent] = useState({});
  const [active,  setActive]  = useState('hero');
  const [text,    setText]    = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/admin/content').then(({ data }) => {
      setContent(data.content);
      setText(JSON.stringify(data.content['hero'] || {}, null, 2));
    }).catch(() => toast.error('Failed to load content'));
  }, []);

  const switchSection = (s) => { setActive(s); setText(JSON.stringify(content[s] || {}, null, 2)); };

  const save = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(text);
      await api.put(`/admin/content/${active}`, { data: parsed });
      setContent(prev => ({ ...prev, [active]: parsed }));
      toast.success(`"${active}" section saved!`);
    } catch (e) {
      if (e instanceof SyntaxError) toast.error('Invalid JSON — fix syntax and retry');
      else toast.error('Save failed');
    } finally { setSaving(false); }
  };

  const SECTIONS = [
    { id:'hero',     icon:'🏠', label:'Hero'     },
    { id:'about',    icon:'ℹ️', label:'About'    },
    { id:'services', icon:'⚡', label:'Services' },
    { id:'faq',      icon:'❓', label:'FAQ'      },
    { id:'contact',  icon:'📧', label:'Contact'  },
  ];

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-textBase">Website Content</h1>
          <p className="text-textDim text-sm mt-1">Edit the content displayed on the public landing page.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary px-6 py-2.5 text-sm shadow-glow shrink-0">
          {saving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : '💾 Save Changes'}
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: '500px' }}>
        {/* Section picker */}
        <div className="w-44 flex flex-col gap-1 shrink-0">
          {SECTIONS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => switchSection(id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${active === id ? 'bg-primary/15 border border-primary/30 text-primary' : 'text-textDim hover:bg-elevated hover:text-textBase'}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-4 py-3 bg-elevated border border-border rounded-xl">
            <span className="text-textMuted text-xs">Editing:</span>
            <span className="text-textBase text-sm font-bold capitalize">{active}</span>
            <span className="text-textMuted text-xs ml-2">— Valid JSON required</span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 bg-elevated border border-border rounded-xl p-5 text-textBase text-sm font-mono leading-relaxed outline-none resize-none focus:border-primary transition-colors"
            spellCheck={false}
            style={{ minHeight: '420px' }}
          />
          <p className="text-textMuted text-xs">⚠️ Changes apply to the live website immediately after saving.</p>
        </div>
      </div>
    </div>
  );
}

// ── Root export ──
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview'  },
    { id: 'users',    icon: '👥', label: 'Users'     },
    { id: 'rooms',    icon: '🏫', label: 'Rooms'     },
    { id: 'content',  icon: '✏️', label: 'Content'   },
  ];

  return (
    <Shell user={user} logout={logout} navigate={navigate} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'overview' && <AdminOverview setActiveTab={setActiveTab} />}
      {activeTab === 'users'    && <AdminUsers />}
      {activeTab === 'rooms'    && <AdminRooms />}
      {activeTab === 'content'  && <AdminContent />}
    </Shell>
  );
}
