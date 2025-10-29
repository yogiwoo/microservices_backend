const express=require("express")
const ChatModel=require("./models")
const router=express.Router()
const chatSchema=require("./chatModel")
const ObjectId=require("mongoose").Types.ObjectId;
const x=new ChatModel()
const authorization = require("./passport")
//if chat instance is not present in database
router.post("/startNewChat",authorization,async (req,res)=>{
    const newChat=await x.startNewChat(req);
    res.json(newChat);
})
//send message to chat
//get all messages from chat
router.get("/searchUsers",async (req,res)=>{
    console.log("this one")
    const users=await x.searchUsers(req);
    res.json(users);
})

router.get("/getMyChats",authorization,async (req,res)=>{
    const chats=await x.myChats(req);
    res.json({message:"My chats",chats:chats})
})
router.post("/sendMessage",authorization,async (req,res)=>{
    const io=req.app.get('io');
   
    const msg=await x.sendMessage(req);
    const xyt=await chatSchema.updateOne({_id:new ObjectId(req.body.chatId)},
    
    {$set:{lastMsg:msg.message,updatedAt:new Date(),isRead:false}});
   
    const emitData = {
        chatId: req.body.chatId.toString(),
        message: msg.message,
        sender: msg.sender.toString(),
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        isRead: false,
        _id: msg._id.toString()
    };
    //io.to(req.body.chatId).emit('receiveMsg',{...msg,chatId: req.body.chatId});
    io.to(req.body.chatId).emit('receiveMsg',emitData);
    res.json({message:'Message sent',data:msg});
})
router.get("/getMyMessage",authorization,async (req,res)=>{
    const data=await x.getMessages(req);
    res.json({message:"All messages",data:data.messages,totalMessages:data.totalMessages});
})
router.get("/redisConn",async (req,res)=>{
    const data=await x.redisConn(req);
    res.json({message:"Redis connection",data:data});
})

// Helper routes for Redis debugging
router.post("/clearRedisKey",async (req,res)=>{
    const data=await x.clearRedisKey(req);
    res.json({message:"Clear Redis key",data:data});
})

router.post("/setRedisKey",async (req,res)=>{
    const data=await x.setRedisKey(req);
    res.json({message:"Set Redis key",data:data});
})

module.exports=router;