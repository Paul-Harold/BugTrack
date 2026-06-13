import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

const EMPTY_FORM = {
  title: '',
  description: '',
  stepsToReproduce: '',
  severity: 'major',
  priority: 'medium',
  assignedTo: '',
};

export default function BugsTab() {
  const { id: projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bugs, setBugs] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const statusFilter = searchParams.get('status') || '';
  const severityFilter = searchParams.get('severity') || '';

  const load = () => {
    const params = new URLSearchParams({ project: projectId });
    if (statusFilter) params.set('status', statusFilter);
    if (severityFilter) params.set('severity', severityFilter);
    api.get(`/bugs?${params}`).then((res) => setBugs(res.data));
  };

  useEffect(() => {
    load();
  }, [projectId, statusFilter, severityFilter]);
  useEffect(() => {
    api.get('/users').then((res) => setUsers(res.data));
  }, []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    setSearchParams(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bugs', { ...form, project: projectId, assignedTo: form.assignedTo || null });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report bug');
    }
  };

  if (!bugs) return <Spinner label="Loading bugs..." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input !w-40" value={statusFilter} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {['open', 'in_progress', 'resolved', 'closed', 'reopened'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="input !w-40" value={severityFilter} onChange={(e) => setFilter('severity', e.target.value)}>
          <option value="">All severities</option>
          {['minor', 'major', 'critical', 'blocker'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="flex-1" />
        <button className="btn-primary" onClick={() => { setShowCreate(true); setError(''); }}>
          + Report Bug
        </button>
      </div>

      {bugs.length === 0 ? (
        <EmptyState icon="🎉" title="No bugs found" hint="Either the software is perfect, or the filters are hiding them." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Severity</th>
                <th className="hidden px-4 py-3 sm:table-cell">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bugs.map((bug) => (
                <tr key={bug._id} className="bg-slate-950/50 transition hover:bg-slate-900">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                    <Link to={bug._id}>{bug.code}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={bug._id} className="font-medium text-slate-200 hover:text-indigo-300">
                      {bug.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge kind="severity" value={bug.severity} /></td>
                  <td className="hidden px-4 py-3 sm:table-cell"><Badge kind="priority" value={bug.priority} /></td>
                  <td className="px-4 py-3"><Badge kind="bugStatus" value={bug.status} /></td>
                  <td className="hidden px-4 py-3 text-slate-400 md:table-cell">{bug.assignedTo?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Report a Bug" onClose={() => setShowCreate(false)} wide>
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                placeholder="Short summary of the defect"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Steps to reproduce</label>
              <textarea
                className="input"
                rows={3}
                placeholder={'1. Go to...\n2. Click...\n3. Observe...'}
                value={form.stepsToReproduce}
                onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Severity</label>
                <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {['minor', 'major', 'critical', 'blocker'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assign to</label>
                <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Report bug
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
