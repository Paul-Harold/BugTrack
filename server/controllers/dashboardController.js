const mongoose = require('mongoose');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const Bug = require('../models/Bug');
const asyncHandler = require('../utils/asyncHandler');

const OPEN_BUG_STATUSES = ['open', 'in_progress', 'reopened'];
const TREND_DAYS = 30;

// GET /api/projects/:id/dashboard — all dashboard widgets in one payload
const getDashboard = asyncHandler(async (req, res) => {
  const projectId = new mongoose.Types.ObjectId(req.params.id);
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const [totalCases, totalRuns, totalBugs, openBugs, execAgg, severityAgg, statusAgg, createdAgg, resolvedAgg] =
    await Promise.all([
      TestCase.countDocuments({ project: projectId }),
      TestRun.countDocuments({ project: projectId }),
      Bug.countDocuments({ project: projectId }),
      Bug.countDocuments({ project: projectId, status: { $in: OPEN_BUG_STATUSES } }),
      // execution results across all runs in the project
      TestRun.aggregate([
        { $match: { project: projectId } },
        { $unwind: '$executions' },
        { $group: { _id: '$executions.status', count: { $sum: 1 } } },
      ]),
      // open bugs grouped by severity
      Bug.aggregate([
        { $match: { project: projectId, status: { $in: OPEN_BUG_STATUSES } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      // all bugs grouped by status
      Bug.aggregate([
        { $match: { project: projectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // bugs created per day (last 30 days)
      Bug.aggregate([
        { $match: { project: projectId, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      // bugs resolved/closed per day (last 30 days)
      Bug.aggregate([
        { $match: { project: projectId, resolvedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const executionBreakdown = { passed: 0, failed: 0, blocked: 0, skipped: 0, untested: 0 };
  for (const e of execAgg) executionBreakdown[e._id] = e.count;
  const totalExecutions = Object.values(executionBreakdown).reduce((a, b) => a + b, 0);
  const executed = totalExecutions - executionBreakdown.untested;
  const passRate = executed > 0 ? Math.round((executionBreakdown.passed / executed) * 100) : 0;

  // daily trend with zero-filled days so the chart has a continuous x-axis
  const createdMap = Object.fromEntries(createdAgg.map((d) => [d._id, d.count]));
  const resolvedMap = Object.fromEntries(resolvedAgg.map((d) => [d._id, d.count]));
  const bugTrend = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const day = new Date(since);
    day.setDate(since.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    bugTrend.push({ date: iso, created: createdMap[iso] || 0, resolved: resolvedMap[iso] || 0 });
  }

  // release readiness: weighted blend of pass rate, coverage, and open critical bugs
  const executedPct = totalExecutions > 0 ? Math.round((executed / totalExecutions) * 100) : 0;
  const openCritical =
    (severityAgg.find((s) => s._id === 'critical')?.count || 0) +
    (severityAgg.find((s) => s._id === 'blocker')?.count || 0);
  const bugScore = Math.max(0, 100 - openCritical * 25);
  const score = Math.round(passRate * 0.5 + executedPct * 0.3 + bugScore * 0.2);
  const label = score >= 85 ? 'ready' : score >= 60 ? 'at_risk' : 'not_ready';

  res.json({
    project: { _id: project._id, name: project.name, key: project.key },
    summary: { totalCases, totalRuns, totalBugs, openBugs, passRate },
    executionBreakdown,
    bugsBySeverity: severityAgg.map((s) => ({ severity: s._id, count: s.count })),
    bugsByStatus: statusAgg.map((s) => ({ status: s._id, count: s.count })),
    bugTrend,
    releaseReadiness: { score, label, passRate, executedPct, openCritical },
  });
});

module.exports = { getDashboard };
