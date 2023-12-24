const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'you must enter a user name'],
  },
  slug: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'you must enter an email'],
    validator: [validator.isEmail, 'this email is not valid'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    minlength: [8, 'The Password should not be less than 8 characters '],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'you must confirm the password'],
    select: false,
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.index({ slug: 1 });
userSchema.index({ email: 1 });

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.select('-__v');
  next();
});

userSchema.pre('save', async function (next) {
  this.slug = slugify(this.name, { lower: true });
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  canditdatePassword,
  userpassword,
) {
  return await bcrypt.compare(canditdatePassword, userpassword);
};

userSchema.methods.changedpasswordAfter = async function (JwtTmeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JwtTmeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = await crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = new mongoose.model('User', userSchema);
module.exports = User;
