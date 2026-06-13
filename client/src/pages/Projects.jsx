import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function Projects() {
  const { user, can } = useAuth();
  const [projects, setProjects] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/projects').then((res) => setProjects(res.data));
  useEffect(() => {
    load();
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', form);
      setShowCreate(false);
      setForm({ name: '', key: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  if (!projects) return <Spinner label="Loading projects..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400">Welcome back, {user.name.split(' ')[0]} 👋</p>
        </div>
        {can.manageProjects && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          hint={can.manageProjects ? 'Create your first project to get started.' : 'Ask a manager to create a project.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="card transition hover:border-indigo-500/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-300">
                  {p.key}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mb-1 font-semibold text-white">{p.name}</h2>
              <p className="mb-3 line-clamp-2 text-sm text-slate-400">{p.description || 'No description'}</p>
              <p className="text-xs text-slate-500">
                {p.members.length} member{p.members.length !== 1 && 's'} · created by {p.createdBy?.name}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}>
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={createProject} className="space-y-4">
            <div>
              <label className="label">Project name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Key (short code, e.g. SHOP)</label>
              <input
                className="input uppercase"
                maxLength={10}
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
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
            <button type="submit" className="btn-primary w-full">
              Create project
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
