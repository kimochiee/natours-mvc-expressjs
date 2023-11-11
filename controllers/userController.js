const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { cloudinary } = require('../utils/cloudinary');

const { deleteOne, updateOne, getOne, getAll } = require('./factoryHandler');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

const uploadUserPhoto = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (req.user.photo_publicId != '') {
    cloudinary.uploader.destroy(
      req.user.photo_publicId,
      {
        invalidate: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to delete' });
        }
      }
    );
  }

  cloudinary.uploader
    .upload_stream(
      {
        folder: 'file-upload',
        transformation: { width: 500, height: 500, crop: 'limit' },
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to upload' });
        }

        req.file.filename = result.secure_url;
        req.file.publicId = result.public_id;
        next();
      }
    )
    .end(req.file.buffer);
};

const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. please use /updateMyPassword',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allow to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) {
    filteredBody.photo = req.file.filename;
    filteredBody.photo_publicId = req.file.publicId;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined yet! Please use /signup instead',
  });
};

const getAllUsers = getAll(User);

const getUser = getOne(User);

const updateUser = updateOne(User);

const deleteUser = deleteOne(User);

module.exports = {
  getMe,
  uploadUserPhoto,
  updateMe,
  deleteMe,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
