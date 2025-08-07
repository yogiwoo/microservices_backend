const express=require('express')
const router=express.Router()
const userMode=require("./model")
const x=new userMode();

router.post('/signup',async (req,res)=>{
   const a= await x.signup(req.body);
   console.log("answer",a)
   if(a){
    res.json(a);
   }
})


router.post('/login',async (req,res)=>{
    const login=await x.login(req.body);
    if(login){
        res.json(login)
    }
})

router.get("/users",async (req,res)=>{
    const users=await x.users(req);
    if(users){
        res.json(users);
    }
})

router.post("/getUserArray",async (req,res)=>{
    console.log("====================>",req.body)
    const users=await x.returnUsersArray(req.body);
    if(users){
        res.json(users);
    }
})

// router.post('/sendRequest',async (req,res)=>{
//     console.log("=============================>")
//     const sendReq=await x.sendRequest(req.body);
//     if(sendReq){
//         res.json(sendReq);
//     }
// })

// router.put('/acceptRequest',async (req,res)=>{
//     const sendReq=await x.acceptRequest(req.body);
//     if(sendReq){
//         res.json(sendReq);
//     }
// })
module.exports=router