const mongoose = require('mongoose');
const validate = require('validator');

const clientSchema = mongoose.Schema({
  client: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      unique:true
    },
  client_mobile_number: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{3}\d{7}/.test(v);
      },
    },
    required: [true, 'Client must have Phone Number!'],
  },
  client_address: {
    type: String,
    trim: true,
    required: [true, 'A Client must have an Address!'],
  },
  client_cnic: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{5}-\d{7}-\d{1}/.test(v);
      },
    },
    required: [true, 'User phone number required'],
  },
  role:{
    type:String,
    default:"Client"
  }
});

clientSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'client',
    select: '-__v -passwordchangedat -password -passwordResetExpire ',
  });
  next();
});

// clientSchema.pre('client_mobile_number').validate(function validatePhone() {
//     return ( this.client_mobile_number > 999999999 );
//   });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
