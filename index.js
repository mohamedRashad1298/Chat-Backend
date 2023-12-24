const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');
const socketIo = require('socket.io')

dotenv.config({ path: './config.env' });

let { DB } = process.env;
DB = DB || 'mongodb+srv://mrashad1298:<password>@cluster0.sub3ggk.mongodb.net/?retryWrites=true&w=majority'
const password = process.env.PASSWORD;

mongoose.connect(DB.replace('<password>', password)).then(() => {
  console.log('DB connected');
});

// const localDB = process.env.LOCAL_DB;
// mongoose.connect(localDB).then(() => {
//   console.log('DB connected');
// });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('working');
});

const io = socketIo(server,{
  pingTimeout:6000,
  cors:{
    origin: 'http://localhost:5173'
  }
})

io.on('connection',(socket)=>{

  socket.on('setup',(userData)=>{
    socket.join(userData._id)
    socket.emit('connected')
  })
socket.on('join chat',(room)=>{
  socket.join(room)
})

socket.on("typing", (room) => socket.in(room).emit("typing"));
socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

socket.on('new message',(newMessageRecived)=>{
 
const chat = newMessageRecived.chat

if(!chat.users) return ;
chat.users.forEach(user => {
  if(user._id === newMessageRecived.sender) return ; 
  socket.in(user._id).emit('message recived',newMessageRecived)
});
})

socket.off("setup", () => {
  console.log("USER DISCONNECTED");
  socket.leave(userData._id);
});
})

process.on('unhandledRejection', (err) => {
  console.log('unhandled Rejection error! shuting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtExpection', (err) => {
  console.log('unhandled Rejection error! shuting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
