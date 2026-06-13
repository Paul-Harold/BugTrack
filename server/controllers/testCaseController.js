const TestCase = require('../models/TestCase');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/testcases?project=<id>&suite=<id>&priority=&status=&search=
const getTestCases = asyncHandler(async (req, res) => {
  const { project, suite, priority, status, search } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (suite) filter.suite = suite === 'none' ? null : suite;
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const cases = await TestCase.find(filter)
    .populate('suite', 'name')
    .populate('createdBy', 'name')
    .sort('seq');
  res.json(cases);
});

// GET /api/testcases/:id
const getTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findById(req.params.id)
    .populate('suite', 'name')
    .populate('createdBy', 'name role');
  if (!testCase) {
    res.status(404);
    throw new Error('Test case not found');
  }
  res.json(testCase);
});

// POST /api/testcases  (qa, manager)
const createTestCase = asyncHandler(async (req, res) => {
  const { project, suite, title, description, preconditions, steps, priority, status, tags } =
    req.body;
  const { seq, key } = await Project.nextSeq(project, 'testCase');
  const testCase = await TestCase.create({
    project,
    suite: suite || null,
    seq,
    code: `${key}-TC${seq}`,
    title,
    description,
    preconditions,
    steps,
    priority,
    status,
    tags,
    createdBy: req.user._id,
  });
  res.status(201).json(testCase);
});

// PUT /api/testcases/:id  (qa, manager)
const updateTestCase = asyncHandler(async (req, res) => {
  const { suite, title, description, preconditions, steps, priority, status, tags } = req.body;
  const testCase = await TestCase.findByIdAndUpdate(
    req.params.id,
    { suite: suite || null, title, description, preconditions, steps, priority, status, tags },
    { new: true, runValidators: true }
  );
  if (!testCase) {
    res.status(404);
    throw new Error('Test case not found');
  }
  res.json(testCase);
});

// DELETE /api/testcases/:id  (qa, manager)
const deleteTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findByIdAndDelete(req.params.id);
  if (!testCase) {
    res.status(404);
    throw new Error('Test case not found');
  }
  res.json({ message: 'Test case deleted' });
});

module.exports = { getTestCases, getTestCase, createTestCase, updateTestCase, deleteTestCase };
