const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/suites?project=<id>
const getSuites = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  const suites = await TestSuite.find(filter).populate('createdBy', 'name').sort('name');

  // include case counts per suite for list views
  const counts = await TestCase.aggregate([
    { $match: { suite: { $in: suites.map((s) => s._id) } } },
    { $group: { _id: '$suite', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  res.json(
    suites.map((s) => ({ ...s.toObject(), caseCount: countMap[s._id.toString()] || 0 }))
  );
});

// POST /api/suites  (qa, manager)
const createSuite = asyncHandler(async (req, res) => {
  const { project, name, description } = req.body;
  const suite = await TestSuite.create({ project, name, description, createdBy: req.user._id });
  res.status(201).json(suite);
});

// PUT /api/suites/:id  (qa, manager)
const updateSuite = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const suite = await TestSuite.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true }
  );
  if (!suite) {
    res.status(404);
    throw new Error('Suite not found');
  }
  res.json(suite);
});

// DELETE /api/suites/:id  (qa, manager) — cases are kept but detached from the suite
const deleteSuite = asyncHandler(async (req, res) => {
  const suite = await TestSuite.findById(req.params.id);
  if (!suite) {
    res.status(404);
    throw new Error('Suite not found');
  }
  await TestCase.updateMany({ suite: suite._id }, { suite: null });
  await suite.deleteOne();
  res.json({ message: 'Suite deleted; its test cases were moved to Unassigned' });
});

module.exports = { getSuites, createSuite, updateSuite, deleteSuite };
