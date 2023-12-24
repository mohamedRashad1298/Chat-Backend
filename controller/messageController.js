const Message = require('../model/messageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../model/userModel');
const Chat = require('../model/chatModel');

exports.createMessage = catchAsync(async (req, res, next) => {
  if (!req.body.content) {
    return next(new AppError('can not Accept empty message content', 400));
  }

  let message = await Message.create({
    sender: req.user,
    content: req.body.content,
    chat: req.body.chat,
  });

  message = await message.populate('sender', 'name pic');
  message = await message.populate('chat');
  message = await User.populate(message, {
    path: 'chat.users',
    select: 'name photo email',
  });

  await Chat.findByIdAndUpdate(req.body.chat, { latestMessage: message });

  res.status(200).json(message);
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (+page - 1) * limit;

  const totalMessagesCount = await Message.countDocuments({ chat: req.params.chatId });


  if (skip >= totalMessagesCount && skip !== 0 ) {
    return res.status(400).json({ message: 'Requested page exceeds available messages.' });
  }
  let message = await Message.find({ chat: req.params.chatId });
message = message.reverse()
  res.status(200).json(message);
});

exports.deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.id);

  res.status(204).json(message);
});
