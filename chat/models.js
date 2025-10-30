const axios = require("axios");
const ChatSession = require("./chatModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const messageModel = require("./message");
const { io } = require("./app");
const { client } = require("./redisManager"); // Import the connected client
class ChatModel {
    async redisConn(data){
        //for testing redis connection and getting data from redis instance
        try {
            console.log("Redis test for key:", data.query.key)
            
            // Check if key exists and its type
            const exists = await client.exists(data.query.key);
           
            if (!exists) {
                return { message: "Key does not exist", exists: false };
            }
            const type = await client.type(data.query.key);
            const listdata=await client.json.get(data.query.key);
            return listdata;
        } catch (error) {
            console.error("Redis error:", error);
            return { error: error.message };
        }
    }
    
    // Helper method to delete/clear a key
    
    async searchUsers(data) {
        try {
            const name = data.query.name;
            const userDetails = await axios.get(`http://localhost:3003/auth/users?name=${name}`);
            return userDetails.data;
        } catch (error) {
            throw new Error(`Error searching users: ${error.message}`);
        }
    }
    async startNewChat(data) {
        try {
            const requestuser = data.body.members.find(i => i.toString() !== data.userId.toString());
            let chatExists = await ChatSession.findOne({
                members: { $all: [new ObjectId(data.userId), new ObjectId(requestuser)] }
            });
            if (chatExists) {
                return { exists: true, chat: chatExists };
            }
            const ids = data.body.members.map(i => new ObjectId(i));
            const newChat = new ChatSession({
                members: ids,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const savedChat = await newChat.save();
            return { exists: false, chat: savedChat };
        } catch (error) {
            throw new Error(`Error creating chat session: ${error.message}`);
        }
    }
    //return chat sessions of the logged in user
    async myChats(req) {
      try{
        let data=await client.exists(req.userId)
        if(data){
         
         return client.json.get(req.userId);
        }
        else{ 
             const userId = req.userId; // Get userId from the request (set by auth middleware)
             if (!userId) {
                 throw new Error('User ID not found');
             }
             let query = [
                 {
                     $match: {
                         members: new ObjectId(userId)  // need to be indxed
                     }
                 },
                 {
                     $unwind: "$members"
                 },
                 {
                     $match: {
                         members: { $ne: new ObjectId(userId) }
                     }
                 },
                 {
                     $lookup: {
                         from: "messages",
                         let: { chatId: "$_id" },
                         pipeline: [
                             { $match: { $expr: { $eq: ["$chatId", "$$chatId"] } } },
                             { $sort: { createdAt: -1 } }, // Sort by latest
                             { $limit: 1 } // Only the latest message
                         ],
                         as: "msg"
                     }
                 },
                 { $unwind: { path: "$msg", preserveNullAndEmptyArrays: true } },
                 {
                     $project: {
                         // userName: "$user.name",
                         // image: "$user.image",
                         userId: "$members",
                         lastMsg: 1,
                         isRead: 1,
                         createdAt: 1,
                         updatedAt: 1
                     }
                 }
             ];
             //include user details in the chat session from auth user POST API
             const chats = await ChatSession.aggregate(query);
             const userIds = chats.map(i => {
                 return i.userId.toString()
             })
             let userArr = await axios.post("http://auth:5005/getUserArray", userIds,
                 {
                     headers: {
                         "Content-Type": "application/json"
                     }
                 }
             )
             let userMap=new Map()
             for(let i of userArr.data){
                 if(userMap.get(i._id)==null){
                     userMap.set(i._id,{name:i.name,image:i.image})
                 }
                   userMap.set(i._id,{name:i.name,image:i.image})
             }
     
             let finalObject=chats.map(i=>{
                const userData = userMap.get(i.userId.toString()) || {};
                 return {
                     ...i,
                     userName:userData.name,
                     image:userData.image
                 }
             })
            
             await client.json.set(req.userId,'$',finalObject);
             await client.expire(req.userId,3*24*60*60);
             return finalObject;
            
        }
      }
      catch(error){
        return  { error: `Error getting messages: ${error}` };
      }
     
    }
    async sendMessage(data) {
     
        try {
            const dat = data.body;
            const x = new messageModel({
                chatId: new ObjectId(dat.chatId),
                sender: new ObjectId(dat.sender),
                message: dat.message,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const savedMessage = await x.save();
            //console.log("****************************************",savedMessage)
            //io.to(dat.chatId).emit('receiveMsg',savedMessage);
            if(savedMessage){
                const x=await ChatSession.updateOne({_id:new ObjectId(dat.chatId)},
                {$set:{updatedAt:new Date()}});
            }
            return savedMessage;
        } catch (Error) {
            return { error: `Error sending message: ${Error.message}` };
        }
    }

    async updateRedisCache(chatId, messageData, userId) {
        try {
            // Get the chat session to find both users
            const chatSession = await ChatSession.findById(chatId);
            if (!chatSession) {
                console.log("Chat session not found");
                return;
            }

            const members = chatSession.members.map(m => m.toString());
            
            // Update cache for both users in the chat
            for (const memberId of members) {
                const exists = await client.exists(memberId);
                if (exists) {
                    // Get the current chat list
                    const chatList = await client.json.get(memberId);
                    
                    // Find and update the specific chat
                    const updatedChatList = chatList.map(chat => {
                        // Match by _id (which is the chatId)
                        if (chat._id && chat._id.toString() === chatId.toString()) {
                            return {
                                ...chat,
                                lastMsg: messageData.message,
                                updatedAt: new Date().toISOString(),
                                isRead: false
                            };
                        }
                        return chat;
                    });
                    
                    // Save updated list back to Redis
                    await client.json.set(memberId, '$', updatedChatList);
                    await client.expire(memberId, 3*24*60*60);
                    console.log(`Updated Redis cache for user: ${memberId}`);
                }
            }
        } catch (error) {
            console.log("Error updating Redis cache:", error);
        }
    }
    async getMessages(data) {
        //Paginated message chunk wise
       try{
        let limit =10
        let page=data.query.page || 1
        let skip=(page-1)*limit
        const messages = await messageModel.find({ chatId: new ObjectId(data.query.chatId) }).sort({ _id: -1 }).limit(limit).skip(skip)
        //also update is read status of chat session
        const updation=await ChatSession.updateOne({_id:new ObjectId(data.query.chatId)},{$set:{isRead:true,updatedAt:new Date()}})
       
        if (messages.length === 0) {
            return { messages: [], totalMessages:0}
        }
        let totalMsg=await messageModel.countDocuments({ chatId: new ObjectId(data.query.chatId) });
        return { messages: messages.reverse(), totalMessages: totalMsg };
       }
       catch(error){
        return { error: `Error getting messages: ${error}` };
       }
    }
}

module.exports = ChatModel;