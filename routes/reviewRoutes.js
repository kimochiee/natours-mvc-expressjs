const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourIdAndUserId,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/').get(getAllReviews).post(setTourIdAndUserId, createReview);

router
  .route('/:id')
  .get(getReview)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

module.exports = router;
