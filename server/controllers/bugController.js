const Bug = require('../models/Bug');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

const BUG_POPULATE = [
  { path: 'reportedBy', select: 'name role' },
  { path: 'assignedTo', select: 'name role' },
  { path: 'testCase', select: 'code title' },
  { path: 'comments.author', select: 'name role' },
];

// Who may move a bug into a given status
const STATUS_PERMISSIONS = {
  open: ['qa', 'manager'],
  in_progress: ['developer', 'manager'],
  resolved: ['developer', 'manager'],
  closed: ['qa', 'manager'],
  reopened: ['qa', 'manager'],
};

// GET /api/bugs?project=&status=&severity=&assignedTo=&search=
const getBugs = asyncHandler(async (req, res) => {
  const { project, status, severity, assignedTo, search } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (assignedTo) filter.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const bugs = await Bug.find(filter).populate(BUG_POPULATE).sort('-createdAt');
  res.json(bugs);
});

// GET /api/bugs/:id
const getBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id).populate(BUG_POPULATE);
  if (!bug) {
    res.status(404);
    throw new Error('Bug not found');
  }
  res.json(bug);
});

// POST /api/bugs  (any authenticated role can report)
const createBug = asyncHandler(async (req, res) => {
  const { project, title, description, stepsToReproduce, severity, priority, assignedTo, testCase } =
    req.body;
  const { seq, key } = await Project.nextSeq(project, 'bug');
  const bug = await Bug.create({
    project,
    seq,
    code: `${key}-BUG${seq}`,
    title,
    description,
    stepsToReproduce,
    severity,
    priority,
    assignedTo: assignedTo || null,
    testCase: testCase || null,
    reportedBy: req.user._id,
  });
  res.status(201).json(await Bug.findById(bug._id).populate(BUG_POPULATE));
});

// PUT /api/bugs/:id — fields editable by all roles; status transitions are role-checked
const updateBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id);
  if (!bug) {
    res.status(404);
    throw new Error('Bug not found');
  }

  const { title, description, stepsToReproduce, severity, priority, assignedTo, status } = req.body;

  if (status && status !== bug.status) {
    const allowed = STATUS_PERMISSIONS[status];
    if (!allowed) {
      res.status(400);
      throw new Error(`Invalid status: ${status}`);
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Only ${allowed.join('/')} can move a bug to "${status}"`);
    }
    bug.status = status;
    bug.resolvedAt = ['resolved', 'closed'].includes(status) ? new Date() : null;
  }

  if (title !== undefined) bug.title = title;
  if (description !== undefined) bug.description = description;
  if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce;
  if (severity !== undefined) bug.severity = severity;
  if (priority !== undefined) bug.priority = priority;
  if (assignedTo !== undefined) bug.assignedTo = assignedTo || null;

  await bug.save();
  res.json(await Bug.findById(bug._id).populate(BUG_POPULATE));
});

// POST /api/bugs/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Comment text is required');
  }
  const bug = await Bug.findById(req.params.id);
  if (!bug) {
    res.status(404);
    throw new Error('Bug not found');
  }
  bug.comments.push({ author: req.user._id, text: text.trim() });
  await bug.save();
  res.status(201).json(await Bug.findById(bug._id).populate(BUG_POPULATE));
});

// DELETE /api/bugs/:id  (manager only)
const deleteBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findByIdAndDelete(req.params.id);
  if (!bug) {
    res.status(404);
    throw new Error('Bug not found');
  }
  res.json({ message: 'Bug deleted' });
});

module.exports = { getBugs, getBug, createBug, updateBug, addComment, deleteBug };
