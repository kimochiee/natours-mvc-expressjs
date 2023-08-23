const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    res
      .status(err.statusCode)
      .render('error', { title: 'something went wrong', msg: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  } else {
    if (err.isOperational) {
      res
        .status(err.statusCode)
        .render('error', { title: 'something went wrong', msg: err.message });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'something went wrong',
        msg: 'Please try again error',
      });
    }
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  console.log(errors);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError('Invalid token, Please log in again', 401);
};

const handleTokenExpiredError = (err) => {
  return new AppError('Your login are expired, Please log in again', 401);
};

//catching global error
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    //CastError xảy ra khi input data bị sai format ở 1 field nào đó
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    //Lỗi 11000 xảy ra khi 1 field nào có value bị lặp lại ở 1 field của document khác (not unique)
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    //ValidationError xảy ra khi field value sai điều kiện ở model
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }
    if (err.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }

    sendErrorProd(error, req, res);
  }

  next();
};
