const router = require('express').Router();
const { getSuites, createSuite, updateSuite, deleteSuite } = require('../controllers/suiteController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getSuites).post(authorize('qa', 'manager'), createSuite);
router
  .route('/:id')
  .put(authorize('qa', 'manager'), updateSuite)
  .delete(authorize('qa', 'manager'), deleteSuite);

module.exports = router;
