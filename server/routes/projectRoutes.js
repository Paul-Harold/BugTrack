const router = require('express').Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getProjects).post(authorize('manager'), createProject);
router
  .route('/:id')
  .get(getProject)
  .put(authorize('manager'), updateProject)
  .delete(authorize('manager'), deleteProject);
router.get('/:id/dashboard', getDashboard);

module.exports = router;
