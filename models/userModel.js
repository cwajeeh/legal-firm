const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userschema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email'],
  },
  photo: {
    type: String,
    default:'default.jpg'
  },
  password: {
    type: String,
    reuired: [true, 'Please provide your password'],
    minlenght: 8,
    select: false,
  },
  passwordconfirm: {
    type: String,
    reuired: [true, 'Please provide your name'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords are not same !!!',
    },
  },
  passwordchangedat: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active:{
    type:Boolean,
    default:true,
    select:false
  }
});

userschema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordconfirm = undefined;
  next();
});

userschema.pre('save', function(next){
  if(!this.isModified('password') || this.isNew){
    return next();
  }

  this.passwordchangedat = Date.now() - 1000;
  next();
});

userschema.pre(/^find/, function(next){
  this.find({active:{$ne:false}});
  next();
})

userschema.methods.correctpassword = async function (
  candidatepassword,
  userpassword
) {
  return await bcrypt.compare(candidatepassword, userpassword);
};

userschema.methods.changedpasswordAfter = function (JWTTimestamp) {
  if (this.passwordchangedat) {
    const chnageTimestamp = parseInt(
      this.passwordchangedat.getTime() / 1000,
      10
    );

    return JWTTimestamp < chnageTimestamp;
  }

  return false;
};

userschema.methods.createPasswordresetTocken = function () {
  const ResetTocken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(ResetTocken)
    .digest('hex');
    // console.log(this.passwordResetToken);

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return ResetTocken;
};

const User = mongoose.model('User', userschema);

module.exports = User;
