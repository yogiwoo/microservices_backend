const mongoose =require('mongoose')
const schema=mongoose.Schema;
const Oid=mongoose.Types.ObjectId;

const userSchema=new schema({
    image:{type:String,default:""},
    name:{type:String,default:"",require:true},
    phone:{type:String,default:"",require:true},
    email:{type:String},
    active:{type:Boolean,default:true},
    joinedAt:Date,
    password:{type:String,default:"",require:true},
    lastSeen:Date
})

const userSch=mongoose.model('User',userSchema)
module.exports=userSch