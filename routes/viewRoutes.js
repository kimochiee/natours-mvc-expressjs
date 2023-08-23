const express = require('express');

const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
} = require('../controllers/viewController');
const { isLoggedIn, protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/me', protect, getAccount);

module.exports = router;
