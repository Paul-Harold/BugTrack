const STYLES = {
  priority: {
    low: 'bg-slate-700/50 text-slate-300',
    medium: 'bg-sky-500/15 text-sky-300',
    high: 'bg-amber-500/15 text-amber-300',
    critical: 'bg-rose-500/15 text-rose-300',
    urgent: 'bg-rose-500/15 text-rose-300',
  },
  severity: {
    minor: 'bg-slate-700/50 text-slate-300',
    major: 'bg-amber-500/15 text-amber-300',
    critical: 'bg-orange-500/15 text-orange-300',
    blocker: 'bg-fuchsia-500/15 text-fuchsia-300',
  },
  bugStatus: {
    open: 'bg-rose-500/15 text-rose-300',
    in_progress: 'bg-amber-500/15 text-amber-300',
    resolved: 'bg-emerald-500/15 text-emerald-300',
    closed: 'bg-slate-700/50 text-slate-400',
    reopened: 'bg-orange-500/15 text-orange-300',
  },
  execStatus: {
    passed: 'bg-emerald-500/15 text-emerald-300',
    failed: 'bg-rose-500/15 text-rose-300',
    blocked: 'bg-amber-500/15 text-amber-300',
    skipped: 'bg-slate-700/50 text-slate-400',
    untested: 'bg-slate-800 text-slate-500',
  },
  runStatus: {
    not_started: 'bg-slate-700/50 text-slate-400',
    in_progress: 'bg-amber-500/15 text-amber-300',
    completed: 'bg-emerald-500/15 text-emerald-300',
  },
  caseStatus: {
    draft: 'bg-slate-700/50 text-slate-400',
    active: 'bg-emerald-500/15 text-emerald-300',
    deprecated: 'bg-rose-500/15 text-rose-300',
  },
  role: {
    qa: 'bg-indigo-500/15 text-indigo-300',
    developer: 'bg-cyan-500/15 text-cyan-300',
    manager: 'bg-amber-500/15 text-amber-300',
  },
};

export default function Badge({ kind, value }) {
  if (!value) return null;
  const cls = STYLES[kind]?.[value] || 'bg-slate-700/50 text-slate-300';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>
      {String(value).replace('_', ' ')}
    </span>
  );
}
