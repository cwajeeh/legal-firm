const express = require('express');
const conversation = require('../controllers/conversationController');

const Router = express.Router();
//new conv

Router.route("/").post(conversation.NewConversation);

//get conv of a user

Router.route("/:userId").get(conversation.getConversation);

module.exports = Router;