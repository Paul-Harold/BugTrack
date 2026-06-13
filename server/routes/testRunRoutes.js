const router = require('express').Router();
const { getRuns, getRun, createRun, recordResult, deleteRun } = require('../controllers/testRunController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getRuns).post(authorize('qa', 'manager'), createRun);
router.route('/:id').get(getRun).delete(authorize('qa', 'manager'), deleteRun);
router.patch('/:id/executions/:caseId', authorize('qa', 'manager'), recordResult);

module.exports = router;
