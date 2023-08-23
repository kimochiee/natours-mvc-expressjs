const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/errorHandler');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

//app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//------------------------Global middleware------------------------------
//Serving static files
app.use(express.static(`${__dirname}/public`));

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      allowOrigins: ['*'],
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['*'],
        scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"],
      },
    },
  })
); //Security HTTP headers

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

//Body parser, reading data to req.body
app.use(
  express.json({
    limit: '10kb',
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Data sanitization against NoSQL query ejection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp());

//-------------------------------route-----------------------------------
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Global error handler: tất cả error đều sẽ đến handler này
app.use(globalErrorHandler);

module.exports = app;
