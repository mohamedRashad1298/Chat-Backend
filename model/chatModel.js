const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const chatSchema = new mongoose.Schema({
    chatName:{
        type:String,
        required:true,
        index:true,
    },
    isGroupChat:{
        type:Boolean,
        default:false
    },
    users:[{
     type:mongoose.Schema.ObjectId,
     ref:"User",
}],
    lastMessage:{
        type:mongoose.Schema.ObjectId,
        ref:'Message'
    },
    groupAdmin:{
     type:mongoose.Schema.ObjectId,
     ref:"User"
    }
},{
 toJSON:{virtuals:true},
 toObject:{virtuals:true},
 timestamps:true
});

//Export the model
module.exports = mongoose.model('Chat', chatSchema);