const router = require('express').Router();
const { getBugs, getBug, createBug, updateBug, addComment, deleteBug } = require('../controllers/bugController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getBugs).post(createBug);
router.route('/:id').get(getBug).put(updateBug).delete(authorize('manager'), deleteBug);
router.post('/:id/comments', addComment);

module.exports = router;
