import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to={user ? '/projects' : '/'} className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm">🐞</span>
          BugTrack
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-slate-300">{user.name}</span>
              <Badge kind="role" value={user.role} />
            </div>
            <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5 text-xs">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary !px-3 !py-1.5 text-xs">
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
