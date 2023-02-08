const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const Email = require('./../utils/email');

const signTocken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createSendTocken = (user, statusCode, res) => {
  const tocken = signTocken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', tocken, cookieOption);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    tocken,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const NewUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordconfirm: req.body.passwordconfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(NewUser, url).sendWelcome();

  createSendTocken(NewUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new appError('Please provide Eail or Password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctpassword(password, user.password))) {
    return next(new appError('Incorrect Email or Password', 401));
  }

  createSendTocken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let tocken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    tocken = req.headers.authorization.split(' ')[1];
  }else if (req.cookies.jwt){
    tocken= req.cookies.jwt;
  }

  if (!tocken) {
    return next(new appError('You are not logged in! please login first', 401));
  }

  const decoded = await promisify(jwt.verify)(tocken, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new appError(
        'The User belonging to this Tocken does no longer exist!',
        401
      )
    );
  }

  if (currentUser.changedpasswordAfter(decoded.iat)) {
    return next(
      new appError('User Recently chnaged password! Please login again.', 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser) {
        return next();
      }
      
      // 3) Check if user changed password after the token was issued
      // if (currentUser.changedPasswordAfter(decoded.iat)) {
      //   console.log(currentUser);
      //   return next();
      // }
      
      // THERE IS A LOGGED IN USER

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You do not have permission to perform this action!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  console.log(user);
  if (!user) {
    return next(new appError('There is no user with this Email!', 404));
  }

  const ResetTocken = user.createPasswordresetTocken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${ResetTocken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // return next(
    //   new appError('There was an error sending the email. Try again later!'),
    //   500
    // );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new appError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordconfirm = req.body.passwordconfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  createSendTocken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //check if posted current password is correct
  if (!(await user.correctpassword(req.body.password, user.password))) {
    return next(
      new appError('Invalid password! Please provide correct Password', 401)
    );
  }
  // if so update password

  user.password = req.body.newpassword;
  user.passwordconfirm = req.body.passwordconfirm;
  await user.save();
  // log in user , send JWT
  createSendTocken(user, 200, res);
});
