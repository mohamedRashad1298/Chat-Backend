const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const messageSchema = new mongoose.Schema({
   sender:{
    type:mongoose.Schema.ObjectId,
    ref:"User"
   },
   content:String,
   chat:{
    type:mongoose.Schema.ObjectId,
    ref:"Chat"
   }
},{
 toJSON:{virtuals:true},
 toObject:{virtuals:true},
 timestamps:true
});

messageSchema.pre(/^find/,function(next){
   this.populate("sender").populate("chat").sort('-createdAt')
   next()
})

//Export the model
module.exports = mongoose.model('Message', messageSchema);