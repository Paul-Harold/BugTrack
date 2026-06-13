import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';

// QA/manager own open/closed/reopen; developers own in_progress/resolved
const TRANSITIONS = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress', 'resolved', 'closed'],
};

export default function BugDetail() {
  const { id: projectId, bugId } = useParams();
  const { user, can } = useAuth();
  const [bug, setBug] = useState(null);
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bugs/${bugId}`).then((res) => setBug(res.data));
    api.get('/users').then((res) => setUsers(res.data));
  }, [bugId]);

  const update = async (changes) => {
    setError('');
    try {
      const { data } = await api.put(`/bugs/${bugId}`, changes);
      setBug(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const { data } = await api.post(`/bugs/${bugId}/comments`, { text: comment });
    setBug(data);
    setComment('');
  };

  if (!bug) return <Spinner label="Loading bug..." />;

  const allowedTransitions = (TRANSITIONS[bug.status] || []).filter((next) => {
    if (['in_progress', 'resolved'].includes(next)) return can.resolveBugs;
    return can.closeBugs;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-1 text-xs text-slate-500">
        <Link to={`/projects/${projectId}/bugs`} className="hover:text-slate-300">← Bugs</Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-indigo-300">{bug.code}</span>
        <h1 className="text-xl font-bold text-white">{bug.title}</h1>
        <Badge kind="bugStatus" value={bug.status} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{bug.description || 'No description provided.'}</p>
            {bug.stepsToReproduce && (
              <>
                <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Steps to Reproduce
                </h3>
                <p className="whitespace-pre-wrap text-sm text-slate-300">{bug.stepsToReproduce}</p>
              </>
            )}
            {bug.testCase && (
              <p className="mt-4 text-xs text-slate-500">
                Linked test case: <span className="font-mono text-indigo-300">{bug.testCase.code}</span> {bug.testCase.title}
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Comments ({bug.comments.length})
            </h3>
            <div className="space-y-3">
              {bug.comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-slate-800/60 px-3 py-2">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{c.author?.name}</span>
                    {c.author && <Badge kind="role" value={c.author.role} />}
                    <span className="text-[11px] text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-300">{c.text}</p>
                </div>
              ))}
              {bug.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
            </div>
            <form onSubmit={addComment} className="mt-4 flex gap-2">
              <input
                className="input"
                placeholder={`Comment as ${user.name}...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="btn-primary">Post</button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Severity</span>
              <Badge kind="severity" value={bug.severity} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Priority</span>
              <Badge kind="priority" value={bug.priority} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Reported by</span>
              <span className="text-slate-200">{bug.reportedBy?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Reported on</span>
              <span className="text-slate-200">{new Date(bug.createdAt).toLocaleDateString()}</span>
            </div>
            {bug.resolvedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Resolved on</span>
                <span className="text-slate-200">{new Date(bug.resolvedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div>
              <label className="label">Assignee</label>
              <select
                className="input"
                value={bug.assignedTo?._id || ''}
                onChange={(e) => update({ assignedTo: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {allowedTransitions.length > 0 && (
            <div className="card">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</h3>
              <div className="flex flex-col gap-2">
                {allowedTransitions.map((next) => (
                  <button key={next} className="btn-secondary capitalize" onClick={() => update({ status: next })}>
                    Move to {next.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
