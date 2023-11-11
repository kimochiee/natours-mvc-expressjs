const express = require('express');

const {
  getOverview,
  getTour,
  getLoginForm,
  // getSignupForm,
  getAccount,
  getMyTours,
} = require('../controllers/viewController');
const { createBookingCheckout } = require('../controllers/bookingController');
const { isLoggedIn, protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
// router.get('/signup', isLoggedIn, getSignupForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

module.exports = router;
