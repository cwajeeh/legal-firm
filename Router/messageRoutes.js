const express = require("express");
const Message = require("../controllers/messageController");
const Router = express.Router();
//add

Router.route("/").post(Message.NewMessage);

//get

Router.route("/:conversationId").get(Message.getMessage);

module.exports = Router;