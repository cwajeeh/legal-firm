const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const Conversation = require("../models/conversationModel");

exports.NewConversation = catchAsync(async (req, res, next) => {
    const newConversation = new Conversation({
        members: [req.body.senderId, req.body.receiverId],
    });
    const savedConversation = await newConversation.save();
    res.status(200).json({
        status: 'success',
        data: {
            savedConversation
        }
    });
});

exports.getConversation = catchAsync(async (req, res, next) => {
    const conversation = await Conversation.find({
        members: { $in: [req.params.userId] },
    });
    if (!conversation) {
        return next(new appError('No Document found with that ID', 404));
      }

    res.status(200).json({
        status: 'success',
        results: conversation.length,
        data: {
            conversation
        }
    });

});