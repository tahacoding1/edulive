import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ROLE_COLORS = { admin: 'text-danger border-danger/40 bg-danger/10', teacher: 'text-accent border-accent/40 bg-accent/10', student: 'text-success border-success/40 bg-success/10' };
const ROLE_ICONS  = { admin: '🛡', teacher: '👨‍🏫', student: '👨‍🎓' };

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {sub && <span className="text-textMuted text-xs bg-elevated border border-border rounded px-2 py-0.5">{sub}</span>}
      </div>
      <p className="text-3xl font-black text-textBase">{value}</p>
      <p className="text-textDim text-sm mt-1">{label}</p>
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [roleF,   setRoleF]   = useState('');
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit: 15, search, role: roleF } });
      setUsers(data.users); setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleF]);

  const updateRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const toggleActive = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input className="input-field flex-1 min-w-[200px] py-2.5 text-sm" placeholder="🔍  Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="input-field py-2.5 text-sm w-40" value={roleF} onChange={e => { setRoleF(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex items-center px-4 bg-elevated border border-border rounded-lg text-textDim text-sm">
          {total} users
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-textMuted py-14 text-sm">No users found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User','Role','Status','Joined','Actions'].map(h => (
                  <th key={h} className="text-left text-textMuted text-[11px] font-bold uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                           style={{ background: 'linear-gradient(135deg,#2979ff,#00d4ff)' }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-textBase text-sm font-semibold leading-tight">{u.name}</p>
                        <p className="text-textMuted text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => updateRole(u._id, e.target.value)}
                      className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 capitalize cursor-pointer bg-transparent outline-none transition-all ${ROLE_COLORS[u.role]}`}>
                      <option value="student">👨‍🎓 Student</option>
                      <option value="teacher">👨‍🏫 Teacher</option>
                      <option value="admin">🛡 Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textMuted text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleActive(u._id)}
                        className={`px-2.5 py-1 text-xs border rounded-lg font-semibold transition-colors ${u.isActive ? 'border-warning/40 text-warning hover:bg-warning/10' : 'border-success/40 text-success hover:bg-success/10'}`}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => deleteUser(u._id, u.name)}
                        className="px-2.5 py-1 text-xs border border-danger/40 text-danger rounded-lg hover:bg-danger/10 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-textDim text-sm">Page {page} of {Math.ceil(total / 15)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Content Editor Tab ──
function ContentTab() {
  const [content, setContent] = useState({});
  const [active,  setActive]  = useState('hero');
  const [text,    setText]    = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/admin/content').then(({ data }) => {
      setContent(data.content);
      setText(JSON.stringify(data.content[active] || {}, null, 2));
    }).catch(() => toast.error('Failed to load content'));
  }, []);

  const switchSection = (s) => {
    setActive(s);
    setText(JSON.stringify(content[s] || {}, null, 2));
  };

  const save = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(text);
      await api.put(`/admin/content/${active}`, { data: parsed });
      setContent(prev => ({ ...prev, [active]: parsed }));
      toast.success(`Section "${active}" saved!`);
    } catch (e) {
      if (e instanceof SyntaxError) toast.error('Invalid JSON — check your syntax');
      else toast.error('Failed to save');
    } finally { setSaving(false); }
  };

  const SECTIONS = ['hero','about','services','faq','contact'];

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)]">
      {/* Section picker */}
      <div className="w-40 flex flex-col gap-1 shrink-0">
        {SECTIONS.map(s => (
          <button key={s} onClick={() => switchSection(s)}
            className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${active === s ? 'bg-primary/15 border border-primary/50 text-primary' : 'text-textDim hover:text-textBase hover:bg-elevated'}`}>
            {s === 'hero' ? '🏠' : s === 'about' ? 'ℹ️' : s === 'services' ? '⚡' : s === 'faq' ? '❓' : '📧'} {s}
          </button>
        ))}
      </div>

      {/* JSON Editor */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-textDim text-sm">Edit the <strong className="text-textBase capitalize">{active}</strong> section content (JSON format):</p>
          <button onClick={save} disabled={saving} className="btn-primary px-5 py-2 text-sm shadow-glow">
            {saving ? 'Saving…' : '💾 Save Section'}
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-elevated border border-border rounded-xl p-4 text-textBase text-sm font-mono leading-relaxed outline-none resize-none focus:border-primary transition-colors"
          spellCheck={false}
        />
        <p className="text-textMuted text-xs">⚠️ Must be valid JSON. Changes apply to the live website immediately after saving.</p>
      </div>
    </div>
  );
}

// ── Rooms Tab ──
function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    api.get('/admin/rooms').then(({ data }) => setRooms(data.rooms)).catch(() => toast.error('Failed to load rooms'));
  }, []);

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {['Classroom','Teacher','Room ID','Status','Created'].map(h => (
              <th key={h} className="text-left text-textMuted text-[11px] font-bold uppercase tracking-widest px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map(r => (
            <tr key={r._id} className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
              <td className="px-4 py-3 text-textBase text-sm font-semibold">{r.name}</td>
              <td className="px-4 py-3 text-textDim text-sm">{r.teacher?.name || '—'}</td>
              <td className="px-4 py-3 font-mono text-accent text-sm tracking-wider">{r.roomId}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {r.isActive ? 'Active' : 'Ended'}
                </span>
              </td>
              <td className="px-4 py-3 text-textMuted text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Admin Page ──
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats,     setStats]     = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, [user, navigate]);

  const TABS = [['dashboard','📊 Dashboard'],['users','👥 Users'],['rooms','🏫 Rooms'],['content','✏️ Website Content']];

  return (
    <div className="min-h-screen bg-bg bg-grid font-sans">
      {/* Header */}
      <header className="h-16 bg-surface border-b border-border flex items-center px-7 gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/dashboard')} className="text-xl font-black gradient-text tracking-tight">◈ EduLive</button>
        <div className="w-px h-5 bg-border" />
        <span className="text-textDim text-sm font-semibold">Admin Panel</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-full px-3 py-1.5">
          <span className="text-danger text-xs font-bold">🛡 {user?.name}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-7 w-fit">
          {TABS.map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-textDim hover:text-textBase'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Total Users"    value={stats?.users       ?? '…'} />
              <StatCard icon="🏫" label="Total Rooms"    value={stats?.rooms       ?? '…'} />
              <StatCard icon="💬" label="Chat Messages"  value={stats?.messages    ?? '…'} />
              <StatCard icon="📋" label="Assignments"    value={stats?.assignments  ?? '…'} />
            </div>

            {stats?.roleBreakdown && (
              <div className="card p-6">
                <h3 className="text-textBase font-bold mb-4">Users by Role</h3>
                <div className="flex gap-4 flex-wrap">
                  {stats.roleBreakdown.map(({ _id: role, count }) => (
                    <div key={role} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${ROLE_COLORS[role]}`}>
                      <span className="text-xl">{ROLE_ICONS[role]}</span>
                      <div>
                        <p className="font-black text-xl">{count}</p>
                        <p className="text-xs capitalize opacity-80">{role}s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-textBase font-bold mb-3">Quick Actions</h3>
              <div className="flex gap-3 flex-wrap">
                {[['👥 Manage Users','users'],['🏫 View Rooms','rooms'],['✏️ Edit Website','content']].map(([label, tab]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-5 py-2.5 bg-elevated border border-border rounded-lg text-textDim text-sm font-semibold hover:border-borderLight hover:text-textBase transition-all">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users'   && <div className="animate-fade-in"><UsersTab /></div>}
        {activeTab === 'rooms'   && <div className="animate-fade-in"><RoomsTab /></div>}
        {activeTab === 'content' && <div className="animate-fade-in"><ContentTab /></div>}
      </div>
    </div>
  );
}
