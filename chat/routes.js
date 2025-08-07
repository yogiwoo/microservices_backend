 const express=require("express")
const ChatModel=require("./models")
const router=express.Router()
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
    io.to(req.body.chatId).emit('receiveMsg',msg);
    res.json({message:'Message sent',data:msg});
})
router.get("/getMyMessage",authorization,async (req,res)=>{
    const data=await x.getMessages(req);
    res.json({message:"All messages",data:data});
})
module.exports=router;