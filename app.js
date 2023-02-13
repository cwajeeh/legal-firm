const path = require('path');
const express = require('express');
const userRoute = require('./Router/userRoutes');
const clientRoute = require('./Router/clientRoutes');
const lawyerRoute = require('./Router/lawyerRoute');
const conversationRoute = require('./Router/conversationRoutes');
const messageRoute = require('./Router/messageRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');


const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(__dirname + '../public'));
// Set security HTTP headers
app.use(helmet());


// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({extended:true, limit:'10kb'}));
app.use(cookieParser());
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES



app.use('/api/v1/users', userRoute);
app.use('/api/v1/clients', clientRoute);
app.use('/api/v1/lawyers', lawyerRoute);
app.use("/api/v1/conversations", conversationRoute);
app.use("/api/v1/messages", messageRoute);


app.all('*', (req, res, next) => {
    next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
  
  app.use(globalErrorHandler);


module.exports = app;