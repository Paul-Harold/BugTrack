import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🧪',
    title: 'Test Management',
    desc: 'Organize test cases into suites with steps, preconditions, priorities and lifecycle status — TestRail-style.',
  },
  {
    icon: '🏃',
    title: 'Test Execution',
    desc: 'Build test runs from your cases and record Pass / Fail / Blocked / Skip results with notes as you go.',
  },
  {
    icon: '🐞',
    title: 'Bug Tracking',
    desc: 'Report defects with severity, priority, assignees and threaded comments through a Jira-like workflow.',
  },
  {
    icon: '📊',
    title: 'QA Dashboards',
    desc: 'Live pass/fail rates, 30-day bug trends and a weighted release-readiness score from MongoDB aggregations.',
  },
];

const ROLES = [
  { name: 'QA Engineer', badge: 'bg-indigo-500/15 text-indigo-300', desc: 'Writes test cases, runs executions, reports bugs and closes them out.' },
  { name: 'Developer', badge: 'bg-cyan-500/15 text-cyan-300', desc: 'Picks up assigned bugs and moves them through in-progress and resolved.' },
  { name: 'Manager', badge: 'bg-amber-500/15 text-amber-300', desc: 'Owns projects and membership, and watches release readiness across the team.' },
];

const STACK = ['React', 'React Router', 'Tailwind CSS', 'Recharts', 'Node.js', 'Express', 'MongoDB', 'JWT Auth'];

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const tryDemo = async () => {
    setLoading(true);
    try {
      await login('qa@bugtrack.dev', 'password123');
      navigate('/projects');
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* ambient glow behind the hero */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />

      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Jira × TestRail, reimagined
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Software QA,
          <br />
          all in one place.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
          BugTrack unifies test cases, test runs and bug tracking with live dashboards and
          release-readiness scoring — so QA, developers and managers stay on the same page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link to="/projects" className="btn-primary !px-6 !py-3 !text-base">
              Go to your projects →
            </Link>
          ) : (
            <>
              <button onClick={tryDemo} disabled={loading} className="btn-primary !px-6 !py-3 !text-base">
                {loading ? 'Loading demo…' : 'Launch live demo →'}
              </button>
              <Link to="/login" className="btn-secondary !px-6 !py-3 !text-base">
                Sign in
              </Link>
            </>
          )}
        </div>
        {!user && (
          <p className="mt-4 text-xs text-slate-500">
            Demo account · <span className="text-slate-400">qa@bugtrack.dev</span> /{' '}
            <span className="text-slate-400">password123</span>
          </p>
        )}
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                {f.icon}
              </div>
              <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* roles */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">Built around your team's roles</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Role-based access keeps everyone focused — enforced on the server and reflected in the UI.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.name} className="card">
              <div className={`mb-3 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${r.badge}`}>
                {r.name}
              </div>
              <p className="text-sm text-slate-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* tech stack */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Built with</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {STACK.map((t) => (
            <span key={t} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        BugTrack — a portfolio project by Paul Harold Batiles
      </footer>
    </div>
  );
}
