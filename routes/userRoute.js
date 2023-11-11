const express = require('express');
const uploadCloud = require('../utils/uploadImages');
const { upload } = require('../utils/cloudinary');
const {
  getMe,
  uploadUserPhoto,
  updateMe,
  deleteMe,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// các route này không cần authenticate
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// các route này cần authenticate
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.get('/getMe', getMe, getUser);
// router.patch('/updateMe', uploadCloud.single('photo'), updateMe);
router.patch('/updateMe', upload.single('photo'), uploadUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

// các route chỉ có admin mới dùng được
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
