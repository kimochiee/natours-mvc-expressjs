const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'user must have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password not the same',
    },
  },
  passwordChangeAt: Date, //Date
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//------------------------MIDDLEWARE--------------------------------
//Hash password for sign up
userSchema.pre('save', async function (next) {
  //chỉ chạy khi password chưa modified
  if (!this.isModified('password')) {
    return next();
  }

  //hash password (modified password)
  this.password = await bcrypt.hash(this.password, 12);

  //xóa field passwordConfirm trong db
  this.passwordConfirm = undefined; //passwordConfirm không tồn tại trong db mà chỉ dùng để so sánh khi user nhập vào

  next();
});

//Update passwordChangeAt when change password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangeAt = Date.now() - 1000;

  next();
});

//Select actived user before find user
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });

  next();
});

//------------------------USER FUNCTION---------------------------------
//Compare password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check JWTTimestamp when user change password (token hết hạn khi user đổi mật khẩu)
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  //false mean not change password
  return false;
};

//Create random token for user to reset password
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
