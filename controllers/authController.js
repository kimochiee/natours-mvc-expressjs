const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//------------------------------------------------------------------------
// Tạo JWT token
const signToken = (id) => {
  return jwt.sign(
    {
      id: id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// Gửi JWT token và jwt cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  //remove user's password from the output (json)
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//------------------------------------------------------------------------
// Tạo tài khoản và gửi token cho user
const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    //role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    //passwordChangeAt: req.body.passwordChangeAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

// Đăng nhập và kiểm tra user
const login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  //1) Kiểm tra email và password đã tồn tại chưa
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2) Kiểm tra User tồn tại chưa và password dúng chưa
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) Nếu thỏa mãn, gửi jwt token tới client
  createSendToken(user, 200, res);
});

// logout user
const logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expire: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({ msg: 'success' });
};

// Quên mật khẩu và gửi email
const forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  //2) Generate random reset token (not the jwt token)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //muốn lưu dữ liệu vào database cần phải thỏa các validate trong model trước, trong trường hợp này không cần validate nên ta bỏ qua

  try {
    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error while sending the email', 500)
    );
  }
});

// Reset mật khẩu khi quên
const resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hasdedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hasdedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not exprired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3) Update changePasswordAt property for the user

  //4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// Update password
const updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) If yes, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
};
