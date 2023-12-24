const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/AppError');
const compression = require('compression');
const globalHandeler = require('./controller/errorController');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoute = require('./router/userRoute');
const chatRoute = require('./router/chatRoute')
const messageRoute = require('./router/messageRoute')

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
);

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimiter({
  max: 2000,
  windowMs: 3600 * 1000,
  message: 'too many request from this IP ,please try again in an hour',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize());
app.use(xss());


// Run pug

app.use('/api/v1/users', userRoute);
app.use('/api/v1/chats', chatRoute);
app.use('/api/v1/message', messageRoute);

// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
// });

app.use(globalHandeler);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "../Client/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "Client", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

module.exports = app;
