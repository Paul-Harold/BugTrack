import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';

const EXEC_COLORS = {
  passed: '#34d399',
  failed: '#fb7185',
  blocked: '#fbbf24',
  skipped: '#94a3b8',
  untested: '#475569',
};
const SEVERITY_COLORS = {
  minor: '#94a3b8',
  major: '#fbbf24',
  critical: '#fb923c',
  blocker: '#e879f9',
};
const READINESS = {
  ready: { color: '#34d399', text: 'Ready to Release' },
  at_risk: { color: '#fbbf24', text: 'At Risk' },
  not_ready: { color: '#fb7185', text: 'Not Ready' },
};

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '12px',
};

function StatCard({ label, value, sub }) {
  return (
    <div className="card !p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function DashboardTab() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/projects/${id}/dashboard`).then((res) => setData(res.data));
  }, [id]);

  if (!data) return <Spinner label="Crunching project metrics..." />;

  const { summary, executionBreakdown, bugsBySeverity, bugTrend, releaseReadiness } = data;
  const execData = Object.entries(executionBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
  const severityData = ['minor', 'major', 'critical', 'blocker'].map((s) => ({
    severity: s,
    count: bugsBySeverity.find((b) => b.severity === s)?.count || 0,
  }));
  const readiness = READINESS[releaseReadiness.label];
  const trendData = bugTrend.map((d) => ({ ...d, day: d.date.slice(5) }));

  return (
    <div className="space-y-4">
      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Test Cases" value={summary.totalCases} />
        <StatCard label="Test Runs" value={summary.totalRuns} />
        <StatCard label="Pass Rate" value={`${summary.passRate}%`} sub="of executed tests" />
        <StatCard label="Open Bugs" value={summary.openBugs} sub={`${summary.totalBugs} total reported`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* release readiness gauge */}
        <div className="card flex flex-col">
          <h3 className="text-sm font-semibold text-white">Release Readiness</h3>
          <div className="relative flex-1" style={{ minHeight: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="95%"
                startAngle={225}
                endAngle={-45}
                data={[{ value: releaseReadiness.score }]}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} fill={readiness.color} background={{ fill: '#1e293b' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{releaseReadiness.score}</span>
              <span className="text-xs font-semibold" style={{ color: readiness.color }}>
                {readiness.text}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-white">{releaseReadiness.passRate}%</p>
              <p className="text-slate-500">pass rate</p>
            </div>
            <div>
              <p className="font-bold text-white">{releaseReadiness.executedPct}%</p>
              <p className="text-slate-500">executed</p>
            </div>
            <div>
              <p className="font-bold text-white">{releaseReadiness.openCritical}</p>
              <p className="text-slate-500">crit. bugs open</p>
            </div>
          </div>
        </div>

        {/* execution result breakdown */}
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-white">Test Execution Results</h3>
          {execData.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No executions recorded yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={execData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {execData.map((entry) => (
                    <Cell key={entry.name} fill={EXEC_COLORS[entry.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(v) => <span className="text-xs capitalize text-slate-300">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* open bugs by severity */}
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-white">Open Bugs by Severity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="severity" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* bug trend */}
      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-white">Bug Trend — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend formatter={(v) => <span className="text-xs capitalize text-slate-300">{v}</span>} />
            <Area type="monotone" dataKey="created" stroke="#fb7185" fill="url(#created)" strokeWidth={2} />
            <Area type="monotone" dataKey="resolved" stroke="#34d399" fill="url(#resolved)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
