import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';

const RESULT_BUTTONS = [
  { status: 'passed', label: 'Pass', cls: 'bg-emerald-600 hover:bg-emerald-500' },
  { status: 'failed', label: 'Fail', cls: 'bg-rose-600 hover:bg-rose-500' },
  { status: 'blocked', label: 'Blocked', cls: 'bg-amber-600 hover:bg-amber-500' },
  { status: 'skipped', label: 'Skip', cls: 'bg-slate-600 hover:bg-slate-500' },
];

export default function RunDetail() {
  const { id: projectId, runId } = useParams();
  const { can } = useAuth();
  const [run, setRun] = useState(null);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api.get(`/runs/${runId}`).then((res) => setRun(res.data));
  }, [runId]);

  const record = async (testCaseId, status) => {
    setSaving(testCaseId);
    try {
      const { data } = await api.patch(`/runs/${runId}/executions/${testCaseId}`, {
        status,
        notes: notes[testCaseId] ?? '',
      });
      setRun(data);
    } finally {
      setSaving(null);
    }
  };

  if (!run) return <Spinner label="Loading test run..." />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-1 text-xs text-slate-500">
        <Link to={`/projects/${projectId}/runs`} className="hover:text-slate-300">← Test Runs</Link>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{run.name}</h1>
        <Badge kind="runStatus" value={run.status} />
      </div>
      {run.description && <p className="mb-4 text-sm text-slate-400">{run.description}</p>}

      <div className="card mb-6 grid grid-cols-3 gap-4 text-center sm:grid-cols-6">
        {[
          ['Total', run.progress.total],
          ['Passed', run.progress.passed],
          ['Failed', run.progress.failed],
          ['Blocked', run.progress.blocked],
          ['Skipped', run.progress.skipped],
          ['Untested', run.progress.untested],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {run.executions.map((exec) => {
          const tc = exec.testCase;
          if (!tc) return null;
          return (
            <div key={tc._id} className="card">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-indigo-300">{tc.code}</span>
                <span className="flex-1 font-medium text-white">{tc.title}</span>
                <Badge kind="priority" value={tc.priority} />
                <Badge kind="execStatus" value={exec.status} />
              </div>
              {tc.steps?.length > 0 && (
                <ol className="mt-3 space-y-1 border-l-2 border-slate-800 pl-4">
                  {tc.steps.map((step, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-slate-300">{i + 1}. {step.action}</span>
                      {step.expected && <span className="text-xs text-emerald-300/70"> → {step.expected}</span>}
                    </li>
                  ))}
                </ol>
              )}
              {exec.status !== 'untested' && (
                <p className="mt-2 text-xs text-slate-500">
                  {exec.status} by {exec.executedBy?.name} on {new Date(exec.executedAt).toLocaleString()}
                  {exec.notes && <> — “{exec.notes}”</>}
                </p>
              )}
              {can.executeTests && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    className="input !w-auto flex-1 !py-1.5 text-xs"
                    placeholder="Execution notes (optional)"
                    value={notes[tc._id] ?? exec.notes ?? ''}
                    onChange={(e) => setNotes({ ...notes, [tc._id]: e.target.value })}
                  />
                  {RESULT_BUTTONS.map((btn) => (
                    <button
                      key={btn.status}
                      disabled={saving === tc._id}
                      onClick={() => record(tc._id, btn.status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${btn.cls} ${
                        exec.status === btn.status ? 'ring-2 ring-white/40' : ''
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
