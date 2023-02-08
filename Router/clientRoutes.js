const express = require('express');
const clientController = require('./../controllers/clientController');
const authController = require('./../controllers/authController');

const Router = express.Router();

Router.route('/')
  .get(clientController.getAll)
  .post(authController.protect,clientController.setUserId,clientController.createClient);

Router.route('/:id')
  .get(clientController.getClient)
  .patch(authController.protect,clientController.updateClient);


module.exports = Router;