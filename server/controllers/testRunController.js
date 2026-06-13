const TestRun = require('../models/TestRun');
const TestCase = require('../models/TestCase');
const asyncHandler = require('../utils/asyncHandler');

const runProgress = (run) => {
  const total = run.executions.length;
  const counts = { passed: 0, failed: 0, blocked: 0, skipped: 0, untested: 0 };
  for (const e of run.executions) counts[e.status] += 1;
  const executed = total - counts.untested;
  return { total, executed, ...counts };
};

// GET /api/runs?project=<id>
const getRuns = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  const runs = await TestRun.find(filter).populate('createdBy', 'name').sort('-createdAt');
  res.json(runs.map((r) => ({ ...r.toObject(), progress: runProgress(r) })));
});

// GET /api/runs/:id
const getRun = asyncHandler(async (req, res) => {
  const run = await TestRun.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('executions.testCase', 'code title priority steps preconditions')
    .populate('executions.executedBy', 'name');
  if (!run) {
    res.status(404);
    throw new Error('Test run not found');
  }
  res.json({ ...run.toObject(), progress: runProgress(run) });
});

// POST /api/runs  (qa, manager) — body.testCases: array of case ids to include
const createRun = asyncHandler(async (req, res) => {
  const { project, name, description, testCases } = req.body;
  if (!Array.isArray(testCases) || testCases.length === 0) {
    res.status(400);
    throw new Error('Select at least one test case for the run');
  }
  const validCases = await TestCase.find({ _id: { $in: testCases }, project }).select('_id');
  const run = await TestRun.create({
    project,
    name,
    description,
    createdBy: req.user._id,
    executions: validCases.map((c) => ({ testCase: c._id })),
  });
  res.status(201).json(run);
});

// PATCH /api/runs/:id/executions/:caseId  (qa, manager) — record a result
const recordResult = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  if (!TestRun.EXECUTION_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${TestRun.EXECUTION_STATUSES.join(', ')}`);
  }
  const run = await TestRun.findById(req.params.id);
  if (!run) {
    res.status(404);
    throw new Error('Test run not found');
  }
  const execution = run.executions.find((e) => e.testCase.toString() === req.params.caseId);
  if (!execution) {
    res.status(404);
    throw new Error('Test case is not part of this run');
  }
  execution.status = status;
  execution.notes = notes || '';
  execution.executedBy = status === 'untested' ? null : req.user._id;
  execution.executedAt = status === 'untested' ? null : new Date();

  // keep run status in sync with progress
  const { untested, total } = runProgress(run);
  run.status = untested === total ? 'not_started' : untested === 0 ? 'completed' : 'in_progress';

  await run.save();
  const populated = await TestRun.findById(run._id)
    .populate('executions.testCase', 'code title priority steps preconditions')
    .populate('executions.executedBy', 'name');
  res.json({ ...populated.toObject(), progress: runProgress(populated) });
});

// DELETE /api/runs/:id  (qa, manager)
const deleteRun = asyncHandler(async (req, res) => {
  const run = await TestRun.findByIdAndDelete(req.params.id);
  if (!run) {
    res.status(404);
    throw new Error('Test run not found');
  }
  res.json({ message: 'Test run deleted' });
});

module.exports = { getRuns, getRun, createRun, recordResult, deleteRun };
