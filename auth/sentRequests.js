let mongoose =require("mongoose");
let ObjectId=mongoose.Types.ObjectId;
let schema=new mongoose.Schema({
    userId:{type:new ObjectId,required:true},
    requestArray:[{type:new ObjectId,ref:"User"}],
    updatedAt:Date
})

const Requests=mongoose.model("sentrequests",schema);
module.exports= Requests