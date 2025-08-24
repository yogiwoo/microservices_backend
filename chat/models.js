const axios = require("axios");
const ChatSession = require("./chatModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const messageModel = require("./message");
const { io } = require("./app");
class ChatModel {
    constructor() {
        // Initialize any required properties
    }
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
        // try {
        const userId = req.userId; // Get userId from the request (set by auth middleware)
        if (!userId) {
            throw new Error('User ID not found');
        }

        let query = [
            {
                $match: {
                    members: new ObjectId(userId)
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
            // {
            //     $lookup: {
            //         from: "users",
            //         localField: "members",
            //         foreignField: "_id",
            //         as: "user"
            //     }
            // },
            // { $unwind: '$user' },
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
                    lastMsg: "$msg.message",
                    isRead: "$msg.isRead",
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
        return finalObject;
        // } catch (error) {
        //     throw new Error(`Error fetching chats: ${error.message}`);
        // }
    }
    async sendMessage(data) {
        console.log("message received");
        const dat = data.body;
        try {
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
    async getMessages(data) {
        console.log("Fetching messages for chat:", data.query.chatId);
        const messages = await messageModel.find({ chatId: new ObjectId(data.query.chatId) }).sort({ _id: 1 })
        if (messages.length === 0) {
            return [];
        }
        return messages;
    }
}

module.exports = ChatModel;