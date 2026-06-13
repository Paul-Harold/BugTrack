const Project = require('../models/Project');
const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const Bug = require('../models/Bug');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find()
    .populate('createdBy', 'name role')
    .populate('members', 'name email role')
    .sort('-createdAt');
  res.json(projects);
});

// GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name role')
    .populate('members', 'name email role');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json(project);
});

// POST /api/projects  (manager only)
const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, members } = req.body;
  const project = await Project.create({
    name,
    key,
    description,
    members: members || [],
    createdBy: req.user._id,
  });
  res.status(201).json(project);
});

// PUT /api/projects/:id  (manager only)
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, members } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { name, description, status, members },
    { new: true, runValidators: true }
  );
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json(project);
});

// DELETE /api/projects/:id  (manager only) — cascades to all project artifacts
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  await Promise.all([
    TestSuite.deleteMany({ project: project._id }),
    TestCase.deleteMany({ project: project._id }),
    TestRun.deleteMany({ project: project._id }),
    Bug.deleteMany({ project: project._id }),
    project.deleteOne(),
  ]);
  res.json({ message: 'Project and all related data deleted' });
});

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
