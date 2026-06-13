import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3">
      <p className="text-5xl">🔍</p>
      <h1 className="text-2xl font-bold text-white">404 — Page not found</h1>
      <Link to="/" className="btn-primary">Back to projects</Link>
    </div>
  );
}
