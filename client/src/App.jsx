import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectLayout from './pages/ProjectLayout';
import DashboardTab from './pages/tabs/DashboardTab';
import SuitesTab from './pages/tabs/SuitesTab';
import CasesTab from './pages/tabs/CasesTab';
import RunsTab from './pages/tabs/RunsTab';
import BugsTab from './pages/tabs/BugsTab';
import RunDetail from './pages/RunDetail';
import BugDetail from './pages/BugDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardTab />} />
          <Route path="suites" element={<SuitesTab />} />
          <Route path="cases" element={<CasesTab />} />
          <Route path="runs" element={<RunsTab />} />
          <Route path="bugs" element={<BugsTab />} />
        </Route>
        <Route
          path="/projects/:id/runs/:runId"
          element={
            <ProtectedRoute>
              <RunDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/bugs/:bugId"
          element={
            <ProtectedRoute>
              <BugDetail />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
