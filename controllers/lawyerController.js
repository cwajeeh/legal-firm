const Lawyer = require('./../models/lawyerModel');
const factory = require('./handlerFactory');

exports.setUserId = (req, res, next) => {
     req.body.lawyer = req.user.id;
    next();
  };

exports.createLawyer = factory.createOne(Lawyer);
exports.getLawyer = factory.getOne(Lawyer, {path : 'users'});
exports.getAll = factory.getAll(Lawyer);
exports.updateLawyer = factory.updateOne(Lawyer);