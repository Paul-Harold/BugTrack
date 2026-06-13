import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const TABS = [
  { to: '', label: 'Dashboard', end: true },
  { to: 'suites', label: 'Test Suites' },
  { to: 'cases', label: 'Test Cases' },
  { to: 'runs', label: 'Test Runs' },
  { to: 'bugs', label: 'Bugs' },
];

export default function ProjectLayout() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setProject(null);
    api
      .get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound)
    return (
      <div className="py-16 text-center text-slate-400">
        Project not found. <Link to="/" className="text-indigo-400">Back to projects</Link>
      </div>
    );
  if (!project) return <Spinner label="Loading project..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-1 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-300">Projects</Link> / {project.key}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-300">{project.key}</span>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ project }} />
    </div>
  );
}
