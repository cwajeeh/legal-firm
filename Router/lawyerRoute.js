const express = require('express');
const lawyerController = require('./../controllers/lawyerController');
const authController = require('./../controllers/authController');

const Router = express.Router();

Router.route('/')
  .get(lawyerController.getAll)
  .post(
    authController.protect,
    lawyerController.setUserId,
    lawyerController.createLawyer
  );

Router.route('/:id')
  .get(lawyerController.getLawyer)
  .patch(authController.protect, lawyerController.updateLawyer);

module.exports = Router;
