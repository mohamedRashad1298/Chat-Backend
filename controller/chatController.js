const Chat = require('../model/chatModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../model/userModel');

exports.accessChat = catchAsync(async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    console.log('UserId param not sent with request');
    return res.sendStatus(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    // .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name pic email',
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'users',
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

exports.fetchChat = catchAsync(async (req, res, next) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      // .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name pic email',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

exports.creatGroup = catchAsync(async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    return next(new AppError('Please Fill all the feilds', 400));
  }

  // const users = JSON.parse(req.body.users);
  const users = req.body.users;


  users.push(req.user);

  const groupChat = await Chat.create({
    chatName: req.body.name,
    users: users,
    isGroupChat: true,
    groupAdmin: req.user,
  });

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate('users')
    .populate('groupAdmin');

  res.status(200).json(fullGroupChat);
});

// Admin group middelware
exports.isAdmin = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    return next(new AppError('Not Found', 404));
  }

  if (!chat.isGroupChat) {
    return next(new AppError('this not a chat group to make this action', 400));
  }

  if (chat.groupAdmin.toString() !== req.user.id) {
    return next(new AppError('your are not Admin', 400));
  }
  next();
});

exports.renameGroup = catchAsync(async (req, res, next) => {
  if (req.body.users) {
    return next(new AppError('the route to update name only', 400));
  }
  if (!req.body.name) {
    return next(new AppError('you must fill fields', 400));
  }

  const newChat = await Chat.findByIdAndUpdate(
    req.params.id,
    {
      chatName: req.body.name,
    },
    {
      new: true,
    },
  );
  res.status(200).json({
    newChat,
  });
});


exports.groupAdd = catchAsync(async (req, res, next) => {

  const checkChat= await Chat.findById(req.params.id)

  const isMember = checkChat.users.find(el => el.toString() === req.body.user._id);

  if(isMember){
    return next(new AppError('this user is already member', 400));
  }

 const newChat = await Chat.findByIdAndUpdate(req.params.id,{
     $push: { users: req.body.user  } 
  }).populate('users', '-password')
  .populate('groupAdmin', '-password');

  res.status(200).json(newChat)
});


exports.groupremove = catchAsync(async (req, res, next) => {

  const checkChat= await Chat.findById(req.params.id)

  const isMember = checkChat.users.find(el => el.toString() === req.body.user._id);

  if(!isMember){
    return next(new AppError('this user is not a member', 400));
  }

 const newChat = await Chat.findByIdAndUpdate(req.params.id,{
     $pull: { users: req.body.user._id  } 
  }).populate('users')
  .populate('groupAdmin');

  res.status(200).json(newChat)
});

exports.getGroup = catchAsync(async(req,res,next)=>{
  
  const chat = await Chat.findById(req.params.id).populate('users')
  .populate('groupAdmin');
if(!chat){
  return next(new AppError('there is no chat with this id'))
}
res.status(200).json(chat)
})