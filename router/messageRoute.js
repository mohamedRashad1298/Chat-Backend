const express = require('express');
const Route = express.Router();
const AuthController = require('../controller/authController');
const messageController = require('../controller/messageController')

Route.use(AuthController.protect)
Route.get('/:chatId',messageController.getMessages)
Route.post('/',messageController.createMessage)
Route.delete('/:id',messageController.deleteMessage)

module.exports = Route;