import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function SuitesTab() {
  const { id: projectId } = useParams();
  const { can } = useAuth();
  const [suites, setSuites] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | suite object
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api.get(`/suites?project=${projectId}`).then((res) => setSuites(res.data));
  useEffect(() => {
    load();
  }, [projectId]);

  const openModal = (suite) => {
    setEditing(suite);
    setForm(suite === 'new' ? { name: '', description: '' } : { name: suite.name, description: suite.description });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api.post('/suites', { ...form, project: projectId });
      else await api.put(`/suites/${editing._id}`, form);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save suite');
    }
  };

  const remove = async (suite) => {
    if (!confirm(`Delete suite "${suite.name}"? Its test cases will be moved to Unassigned.`)) return;
    await api.delete(`/suites/${suite._id}`);
    load();
  };

  if (!suites) return <Spinner label="Loading suites..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{suites.length} suite{suites.length !== 1 && 's'}</p>
        {can.editTests && (
          <button className="btn-primary" onClick={() => openModal('new')}>
            + New Suite
          </button>
        )}
      </div>

      {suites.length === 0 ? (
        <EmptyState icon="🗂️" title="No test suites yet" hint="Suites group related test cases (e.g. Authentication, Checkout)." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suites.map((s) => (
            <div key={s._id} className="card flex flex-col">
              <h3 className="font-semibold text-white">{s.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-400">{s.description || 'No description'}</p>
              <div className="mt-3 flex items-center justify-between">
                <Link
                  to={`../cases?suite=${s._id}`}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {s.caseCount} test case{s.caseCount !== 1 && 's'} →
                </Link>
                {can.editTests && (
                  <div className="flex gap-2">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => openModal(s)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => remove(s)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New Test Suite' : 'Edit Suite'} onClose={() => setEditing(null)}>
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
              {editing === 'new' ? 'Create suite' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
