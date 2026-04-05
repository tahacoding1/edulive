import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AssignmentsPanel({ user, roomId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [roomId]);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get(`/assignments/${roomId}`);
      setAssignments(data.assignments);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const postAssignment = async () => {
    if (!title.trim()) { toast.error('Title is required.'); return; }
    setPosting(true);
    try {
      const { data } = await api.post(`/assignments/${roomId}`, {
        title: title.trim(), description: desc.trim(),
        deadline: deadline || undefined,
      });
      setAssignments(prev => [data.assignment, ...prev]);
      setTitle(''); setDesc(''); setDeadline(''); setShowForm(false);
      toast.success('Assignment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post assignment.');
    } finally { setPosting(false); }
  };

  const submitFile = async (assignmentId, file) => {
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post(`/assignments/${assignmentId}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment submitted! ✅');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    }
  };

  const mySubmission = (a) =>
    a.submissions?.find(s => s.student?._id === user._id || s.student === user._id);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-3 overflow-y-auto h-full flex flex-col gap-3">
      {user.role === 'teacher' && (
        <button onClick={() => setShowForm(s => !s)}
          className={`w-full py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${
            showForm
              ? 'bg-elevated border-border text-textDim'
              : 'bg-gradient-to-r from-primary to-accent text-white border-transparent shadow-glow'
          }`}>
          {showForm ? '✕ Cancel' : '+ Post Assignment'}
        </button>
      )}

      {/* Create form */}
      {showForm && user.role === 'teacher' && (
        <div className="card p-4 flex flex-col gap-3 animate-slide-up">
          {[
            { label: 'Assignment Title *', val: title,    set: setTitle,    type: 'text' },
            { label: 'Instructions',       val: desc,     set: setDesc,     type: 'text' },
          ].map(({ label, val, set, type }) => (
            <div key={label}>
              <p className="text-textDim text-xs font-semibold mb-1.5">{label}</p>
              <input type={type} value={val} onChange={e => set(e.target.value)}
                className="input-field text-sm py-2.5" placeholder={label.replace(' *', '')} />
            </div>
          ))}
          <div>
            <p className="text-textDim text-xs font-semibold mb-1.5">Deadline</p>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="input-field text-sm py-2.5" style={{ colorScheme: 'dark' }} />
          </div>
          <button onClick={postAssignment} disabled={posting}
            className="btn-primary py-2.5 text-sm">
            {posting ? 'Posting...' : 'Post Assignment'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {assignments.length === 0 && (
        <div className="text-center text-textMuted py-12 flex flex-col items-center gap-2">
          <span className="text-4xl">📋</span>
          <p className="text-sm">
            {user.role === 'teacher' ? 'No assignments posted yet.' : 'No assignments from your teacher yet.'}
          </p>
        </div>
      )}

      {/* Assignment cards */}
      {assignments.map(a => {
        const sub = mySubmission(a);
        return (
          <div key={a._id} className="card p-4 animate-fade-in">
            <div className="flex items-start justify-between mb-1.5">
              <p className="text-textBase font-bold text-sm leading-snug">{a.title}</p>
              <span className="text-textMuted text-[10px] ml-2 flex-shrink-0">
                {new Date(a.createdAt).toLocaleDateString()}
              </span>
            </div>

            {a.description && (
              <p className="text-textDim text-xs leading-relaxed mb-2">{a.description}</p>
            )}

            {a.deadline && (
              <div className="flex items-center gap-1.5 text-warning text-xs mb-3">
                ⏰ Due: {new Date(a.deadline).toLocaleString()}
              </div>
            )}

            {user.role === 'student' && (
              sub ? (
                <div className="px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-success text-xs">
                  ✅ Submitted: <strong>{sub.fileName}</strong>
                  <span className="ml-2 text-success/60">
                    {new Date(sub.submittedAt).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/40
                                  rounded-lg cursor-pointer text-primary text-xs font-semibold hover:bg-primary/20
                                  transition-colors">
                  📎 Submit File
                  <input type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
                    onChange={e => e.target.files[0] && submitFile(a._id, e.target.files[0])} />
                </label>
              )
            )}

            {user.role === 'teacher' && (
              <p className="text-textMuted text-xs mt-2">
                Submissions: {a.submissions?.length || 0}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
