import { Fragment, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

const EMPTY_FORM = {
  suite: '',
  title: '',
  description: '',
  preconditions: '',
  priority: 'medium',
  status: 'active',
  steps: [{ action: '', expected: '' }],
};

export default function CasesTab() {
  const { id: projectId } = useParams();
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState(null);
  const [suites, setSuites] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | case object
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const suiteFilter = searchParams.get('suite') || '';
  const priorityFilter = searchParams.get('priority') || '';

  const load = () => {
    const params = new URLSearchParams({ project: projectId });
    if (suiteFilter) params.set('suite', suiteFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    api.get(`/testcases?${params}`).then((res) => setCases(res.data));
  };

  useEffect(() => {
    load();
  }, [projectId, suiteFilter, priorityFilter]);
  useEffect(() => {
    api.get(`/suites?project=${projectId}`).then((res) => setSuites(res.data));
  }, [projectId]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    setSearchParams(next);
  };

  const openModal = (tc) => {
    setEditing(tc);
    setError('');
    setForm(
      tc === 'new'
        ? EMPTY_FORM
        : {
            suite: tc.suite?._id || '',
            title: tc.title,
            description: tc.description,
            preconditions: tc.preconditions,
            priority: tc.priority,
            status: tc.status,
            steps: tc.steps.length ? tc.steps : [{ action: '', expected: '' }],
          }
    );
  };

  const setStep = (i, key, value) => {
    const steps = form.steps.map((s, idx) => (idx === i ? { ...s, [key]: value } : s));
    setForm({ ...form, steps });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, steps: form.steps.filter((s) => s.action.trim()) };
    try {
      if (editing === 'new') await api.post('/testcases', { ...payload, project: projectId });
      else await api.put(`/testcases/${editing._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test case');
    }
  };

  const remove = async (tc) => {
    if (!confirm(`Delete ${tc.code} "${tc.title}"?`)) return;
    await api.delete(`/testcases/${tc._id}`);
    load();
  };

  if (!cases) return <Spinner label="Loading test cases..." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input !w-48" value={suiteFilter} onChange={(e) => setFilter('suite', e.target.value)}>
          <option value="">All suites</option>
          {suites.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
          <option value="none">Unassigned</option>
        </select>
        <select className="input !w-40" value={priorityFilter} onChange={(e) => setFilter('priority', e.target.value)}>
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'critical'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="flex-1" />
        {can.editTests && (
          <button className="btn-primary" onClick={() => openModal('new')}>
            + New Test Case
          </button>
        )}
      </div>

      {cases.length === 0 ? (
        <EmptyState icon="🧪" title="No test cases found" hint="Create a test case or adjust the filters." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 md:table-cell">Suite</th>
                <th className="px-4 py-3">Priority</th>
                <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cases.map((tc) => (
                <Fragment key={tc._id}>
                  <tr
                    className="cursor-pointer bg-slate-950/50 transition hover:bg-slate-900"
                    onClick={() => setExpanded(expanded === tc._id ? null : tc._id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300">{tc.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{tc.title}</td>
                    <td className="hidden px-4 py-3 text-slate-400 md:table-cell">{tc.suite?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge kind="priority" value={tc.priority} /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Badge kind="caseStatus" value={tc.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {can.editTests && (
                        <span className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => openModal(tc)}>Edit</button>
                          <button className="btn-danger" onClick={() => remove(tc)}>Delete</button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {expanded === tc._id && (
                    <tr className="bg-slate-900/60">
                      <td colSpan={6} className="px-6 py-4">
                        {tc.description && <p className="mb-2 text-sm text-slate-300">{tc.description}</p>}
                        {tc.preconditions && (
                          <p className="mb-3 text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">Preconditions:</span> {tc.preconditions}
                          </p>
                        )}
                        {tc.steps.length > 0 && (
                          <ol className="space-y-2">
                            {tc.steps.map((step, i) => (
                              <li key={i} className="flex gap-3 text-sm">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-slate-200">{step.action}</p>
                                  {step.expected && <p className="text-xs text-emerald-300/80">Expected: {step.expected}</p>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}
                        <p className="mt-3 text-xs text-slate-500">Created by {tc.createdBy?.name}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New Test Case' : `Edit ${editing.code}`} onClose={() => setEditing(null)} wide>
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Suite</label>
                <select className="input" value={form.suite} onChange={(e) => setForm({ ...form, suite: e.target.value })}>
                  <option value="">Unassigned</option>
                  {suites.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['draft', 'active', 'deprecated'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Preconditions</label>
              <input
                className="input"
                value={form.preconditions}
                onChange={(e) => setForm({ ...form, preconditions: e.target.value })}
                placeholder="e.g. User has a registered account"
              />
            </div>
            <div>
              <label className="label">Steps</label>
              <div className="space-y-2">
                {form.steps.map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input"
                      placeholder={`Step ${i + 1} action`}
                      value={step.action}
                      onChange={(e) => setStep(i, 'action', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Expected result"
                      value={step.expected}
                      onChange={(e) => setStep(i, 'expected', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary !px-3"
                      onClick={() => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) })}
                      disabled={form.steps.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                onClick={() => setForm({ ...form, steps: [...form.steps, { action: '', expected: '' }] })}
              >
                + Add step
              </button>
            </div>
            <button type="submit" className="btn-primary w-full">
              {editing === 'new' ? 'Create test case' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
