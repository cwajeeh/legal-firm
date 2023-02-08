const mongoose = require('mongoose');
const validate = require('validator');

const lawyerSchema = mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    unique: true,
  },
  lawyer_mobile_number: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{3}\d{7}/.test(v);
      },
    },
    required: [true, 'Lawyer must have Phone Number!'],
  },
  lawyer_cnic: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{5}-\d{7}-\d{1}/.test(v);
      },
    },
    required: [true, 'User phone number required'],
  },
  role: {
    type: String,
    default: 'Lawyer',
  },
  lawyer_address: {
    type: String,
    trim: true,
    required: [true, 'A Lawyer must have an Address!'],
  },
  lawyer_speciality: {
    type: String,
    trim: true,
    required: [true, 'A lawyer must be specialized in any category!'],
  },
  speaking_language: {
    type: String,
    trim: true,
  },
  lawyer_extra_specialaity: {
    type: String,
    trim: true,
  },
  lawyer_featured_status: {
    type: String,
    trim: true,
  },
});

lawyerSchema.pre(/^find/, function (next) {
    this.populate({
      path: 'lawyer',
      select: '-__v -passwordchangedat -password -passwordResetExpire ',
    });
    next();
  });

const Lawyer = mongoose.model('Lawyer', lawyerSchema);

module.exports = Lawyer;