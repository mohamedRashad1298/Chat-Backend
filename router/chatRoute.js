const express = require('express');
const Route = express.Router();
const AuthController = require('../controller/authController');
const ChatController = require('../controller/chatController')

Route.use(AuthController.protect)
Route.get('/',ChatController.fetchChat)
Route.post('/',ChatController.accessChat)

Route.post('/group',ChatController.creatGroup)
Route.get('/group/:id',ChatController.getGroup)

Route.patch('/renamegroup/:id',ChatController.isAdmin,ChatController.renameGroup)
Route.patch('/groupadd/:id',ChatController.isAdmin,ChatController.groupAdd)
Route.patch('/groupremove/:id',ChatController.isAdmin,ChatController.groupremove)

module.exports = Route;
