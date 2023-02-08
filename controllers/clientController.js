const Client = require('./../models/clientModel');
const factory = require('./handlerFactory');

exports.setUserId = (req, res, next) => {
     req.body.client = req.user.id;
    next();
  };

exports.createClient = factory.createOne(Client);
exports.getClient = factory.getOne(Client, {path : 'users'});
exports.getAll = factory.getAll(Client);
exports.updateClient = factory.updateOne(Client);