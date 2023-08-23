const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  //1) Lấy token từ header và kiểm tra token có tồn tại không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not log in! please log in to get access', 401)
    );
  }

  //2) Xác minh token (giải mã token ra HEADER, payload, VERIFY SIGNATURE)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Kiểm tra người dùng còn tồn tại không (trong trường hợp token được gửi về còn tài khoản user bị xóa)
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  //4) Kiểm tra khi người dùng đổi mật khẩu sau khi token đã đưọc cấp
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  // Grant access to the protected route to the next middleware
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array: ['admin', 'lead'guide'] so role 'user' doesn't have permission
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }

  next();
};

module.exports = { protect, restrictTo, isLoggedIn };
