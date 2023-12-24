const AppError = require('../utils/AppError');

const handleCastError = (error) => {
  const message = `Invalid ${error.path} : ${error.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFields = (error) => {
  const errMsg = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate Field value : ${errMsg} please use anthor value`;
  return new AppError(message, 400);
};
const handleValidatorError = (error) => {

  const message = Object.values(error.errors).map((el) => el.message);
  return new AppError(`Invalid input Data .${message.join('. ')}`, 400);
};

const handleTokenError = (error) => {
  return new AppError(`${error.message}`, 401);
};
const handleExpiredTokenError = (error) => {
  return new AppError(`Your token has been expired ! please log in again`, 401);
};

const errDevMode = (err, res) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });

    // res.status(err.statusCode).render('error',{
    //   title:'someThing went wrong',
    //   msg:err.message
    // })
};

const errProdMode = (err, res) => {
  console.log(err)
  if (err.isOperational) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // console.error('Error 🔥', err);
    res.status(err.statusCode || 500).json({
      status: 500,
      message: 'something went very worrng trying to fix soon 🔧',
    });
  }
};
module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(err);
    errDevMode(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = {};
   
    if (err.name === 'CastError') {
      error = handleCastError(err);
    }
    if (err.code === 11000) {
   
      error = handleDuplicateFields(err);
    }
    if (err.name === 'ValidationError') {
      
      error = handleValidatorError(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleTokenError(err);
    }
    if (err.name === 'TokenExpiredError') {
      error = handleExpiredTokenError(err);
    }
error = err

    errProdMode(error, res);
  }
};


