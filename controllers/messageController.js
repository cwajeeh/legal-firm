const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const message = require("../models/messageModel");

exports.NewMessage= catchAsync(async (req, res, next) => {
    const newMessage = new message(req.body);
    const savedMessage = await newMessage.save();
    res.status(200).json({
        status: 'success',
        data: {
            savedMessage
        }
    });
});

exports.getMessage = catchAsync(async (req, res, next) => {
    const messages = await message.find({
        conversationId: req.params.conversationId,
      });
    if (!messages) {
        return next(new appError('No Document found with that ID', 404));
      }

    res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
            messages
        }
    });

});
