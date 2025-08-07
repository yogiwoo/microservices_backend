const mongoose =require("mongoose");
const schema = mongoose.Schema;
const ObjectId=mongoose.Types.ObjectId;
const messageModel=new schema({
    chatId:{type:ObjectId,ref:'ChatSession'},//my id and other user id
    sender:{type:ObjectId,ref:'Users'},
    message:{type:String,default:''},
    isRead:{type:Boolean,default:false},
    createdAt:Date,
    updatedAt:Date
})
const MessageCollection=mongoose.model("Messages",messageModel);
module.exports=MessageCollection;