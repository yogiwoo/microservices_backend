let mongoose =require("mongoose");
let ObjectId=mongoose.Types.ObjectId;
let schema=new mongoose.Schema({
    userId:{type:new ObjectId,required:true},
    requestArray:[{type:new ObjectId,ref:"User"}],
    updatedAt:Date
})

const ReceviedRequests=mongoose.model("ReceivedRequests",schema);
module.exports= ReceviedRequests;