const router = require('express').Router();
const {
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} = require('../controllers/testCaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getTestCases).post(authorize('qa', 'manager'), createTestCase);
router
  .route('/:id')
  .get(getTestCase)
  .put(authorize('qa', 'manager'), updateTestCase)
  .delete(authorize('qa', 'manager'), deleteTestCase);

module.exports = router;
