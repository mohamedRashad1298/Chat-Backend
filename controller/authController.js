const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');


// generat token to user
const generatToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIRIN_TIME  ,
  });
};

// send tokns
const sendTokenRespone = (user, statusCode, res) => {
  const token = generatToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIERES_IN  * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// singup new User
exports.signUp = catchAsync(async (req, res, next) => {

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo:req.body.photo
  });
//   const url= `${req.protocol}://${req.get(
//     'host',
//   )}/me`
// await new Email(newUser,url).sendWelcome()
  sendTokenRespone(newUser, 200, res);
});

// Login section
exports.logIn = catchAsync(async (req, res, next) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('you must enter email & password', 400));
  }

  const user = await User.findOne({
    email,
  }).select('+password');
  if (!user) {
    return next(new AppError(`This user is not exist try again `, 404));
  }

  const checkPassword = await user.correctPassword(password, user.password);

  if (!checkPassword) {
    return next(new AppError(`The password is wrong try again `, 400));
  }

  sendTokenRespone(user, 201, res);
});

exports.protect = catchAsync(async (req, res, next) => {

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }else if(req.cookies.jwt){
token =req.cookies.jwt
  } 
  if (!token) {
    return next(
      new AppError('you must signup or login to get to this route', 401),
    );
  }

  const docoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);

  const currentUser = await User.findById(docoded.id);

  if (!currentUser) {
    return next(new AppError('this token belong to user no more exist'));
  }

  if (await currentUser.changedpasswordAfter(docoded.iat)) {
    return next(
      new AppError(
        ' the user changed the password recently please login again',400
      ),
    );
  }

  req.user = currentUser;
  // req.locals.user = currentUser;
  next();
});


exports.isLoggedIn= async (req, res, next) => {
  try{
  let token;
 
  if(req.cookies.jwt){
token =req.cookies.jwt
  }


if(token){
  const docoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);

  const currentUser = await User.findById(docoded.id);

  if(!currentUser){return next()}

  res.locals.user = currentUser;
}
  next();
}catch(err) {
return next()
}
};

// restrict Route
exports.restrictTo = (...roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`you do not have permission to do this action`, 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`there is no user with this email found`, 404));
  }
  const resetToken = await user.createPasswordResetToken();
  await user.save();
  // res.status(200).json({
  //   status: 'success',
  //   resetToken,
  // });

  const restUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/users/resetpassword/${resetToken}`;

  const message = `Forgot your password ? submit Patch request with new password & passwordConfirm in 
  this url:${restUrl}.\n if you didn't , please ignore message `;

  try {
    await new Email(user,restUrl).restPassword()
    // await sendEmail({
    //   email: req.body.email,
    //   subject: 'you password reset token valid for 10 min',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token has been sent',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'there was an error with sending email try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = await crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Invalid Token or has been expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenRespone(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm)
    return next(new AppError('You must enter the current password'), 400);
  const user = await User.findById(req.user._id).select('+password');

  const check = user.correctPassword(currentPassword, user.password);

  if (!check) {
    return next(
      new AppError(`this password is not correct please try again`, 401),
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  sendTokenRespone(user, 200, res);
});

exports.me = async(req,res,next)=>{
 
  const user = await User.findOne({email:"mrashad20@g.com"})
  res.locals.user = user
  next()
}
