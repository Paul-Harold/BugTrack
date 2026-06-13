import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

function ProgressBar({ progress }) {
  const { total, passed, failed, blocked, skipped } = progress;
  if (total === 0) return null;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div style={{ width: pct(passed) }} className="bg-emerald-400" />
      <div style={{ width: pct(failed) }} className="bg-rose-400" />
      <div style={{ width: pct(blocked) }} className="bg-amber-400" />
      <div style={{ width: pct(skipped) }} className="bg-slate-500" />
    </div>
  );
}

export default function RunsTab() {
  const { id: projectId } = useParams();
  const { can } = useAuth();
  const [runs, setRuns] = useState(null);
  const [cases, setCases] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', testCases: [] });
  const [error, setError] = useState('');

  const load = () => api.get(`/runs?project=${projectId}`).then((res) => setRuns(res.data));
  useEffect(() => {
    load();
    api.get(`/testcases?project=${projectId}&status=active`).then((res) => setCases(res.data));
  }, [projectId]);

  const toggleCase = (id) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.includes(id) ? f.testCases.filter((c) => c !== id) : [...f.testCases, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/runs', { ...form, project: projectId });
      setShowCreate(false);
      setForm({ name: '', description: '', testCases: [] });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create run');
    }
  };

  const remove = async (run) => {
    if (!confirm(`Delete run "${run.name}" and all its results?`)) return;
    await api.delete(`/runs/${run._id}`);
    load();
  };

  if (!runs) return <Spinner label="Loading test runs..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{runs.length} run{runs.length !== 1 && 's'}</p>
        {can.executeTests && (
          <button className="btn-primary" onClick={() => { setShowCreate(true); setError(''); }}>
            + New Test Run
          </button>
        )}
      </div>

      {runs.length === 0 ? (
        <EmptyState icon="🏃" title="No test runs yet" hint="A run selects test cases to execute against a build or release." />
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run._id} className="card">
              <div className="flex flex-wrap items-center gap-3">
                <Link to={run._id} className="font-semibold text-white hover:text-indigo-300">
                  {run.name}
                </Link>
                <Badge kind="runStatus" value={run.status} />
                <span className="flex-1" />
                <span className="text-xs text-slate-500">
                  {run.progress.executed}/{run.progress.total} executed · by {run.createdBy?.name}
                </span>
                {can.executeTests && (
                  <button className="btn-danger" onClick={() => remove(run)}>Delete</button>
                )}
              </div>
              {run.description && <p className="mt-1 text-sm text-slate-400">{run.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar progress={run.progress} />
                <span className="whitespace-nowrap text-xs text-slate-400">
                  ✓ {run.progress.passed} · ✗ {run.progress.failed}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Test Run" onClose={() => setShowCreate(false)} wide>
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Run name</label>
                <input
                  className="input"
                  placeholder="e.g. Sprint 25 Regression"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">
                Test cases to include ({form.testCases.length} selected)
              </label>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-700 p-2">
                {cases.length === 0 && (
                  <p className="p-2 text-sm text-slate-500">No active test cases in this project yet.</p>
                )}
                {cases.map((tc) => (
                  <label
                    key={tc._id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      className="accent-indigo-500"
                      checked={form.testCases.includes(tc._id)}
                      onChange={() => toggleCase(tc._id)}
                    />
                    <span className="font-mono text-xs text-indigo-300">{tc.code}</span>
                    <span className="flex-1 text-slate-200">{tc.title}</span>
                    <Badge kind="priority" value={tc.priority} />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                onClick={() =>
                  setForm({
                    ...form,
                    testCases: form.testCases.length === cases.length ? [] : cases.map((c) => c._id),
                  })
                }
              >
                {form.testCases.length === cases.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={form.testCases.length === 0}>
              Create run
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
