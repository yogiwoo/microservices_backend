const mongoose=require("mongoose")
const Oid=mongoose.Types.ObjectId;
const schema =new mongoose.Schema({
    members:[{type:Oid,default:null}],
    lastMsg:{type:String,default:""},
    createdAt:Date,
    updatedAt:Date
})

const ChatCollection=mongoose.model("ChatSession",schema);
module.exports=ChatCollection;