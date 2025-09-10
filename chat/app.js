const express = require('express');
const http = require("http");
const { Server } = require("socket.io");
const app = express();
require('dotenv').config();
const route = require("./routes");
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const corsOptions = {
    origin: "http://localhost:5173", // Adjust this to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
const io = new Server(server, {
   cors: corsOptions
})
// Routes
app.set('io',io);
module.exports =app
let oUsers=new Map();
io.on('connection', (socket) => {
//     socket.on('sendMsg', (data) => {
//     console.log("Message received on server:", data); // <-- this must log
// });
    console.log("User connected", socket.id);
    //{TODO}dont let the register user more than once in the online map 
    socket.on("registerUser",(userId)=>{
        console.log("---------------------------------->userId received registerd",userId)
        oUsers.set(socket.id,userId)
        console.log("----online users ====",oUsers.values())
        io.emit('onlineStatus',Array.from(oUsers.values()))
    })
    socket.on('joinRoom',(roomId)=>{
        socket.join(roomId)
        console.log("joined room",roomId)
    })
    socket.on('leaveRoom',(roomId)=>{
        socket.leave(roomId)
        console.log("left room",roomId)
    })
    socket.on('sendMsg', (data) => {
        io.to(data.chatId).emit('receiveMsg',data);
    })

    socket.on('disconnect', (data) => {
        console.log('user disconnected', socket.id)
        const userId = oUsers.get(socket.id); //online users
        oUsers.delete(socket.id);
        // Broadcast updated online users
        io.emit('onlineStatus', Array.from(oUsers.values()));

    })
})

//app.options('*', cors(corsOptions));
app.use(cors(corsOptions)); // Apply CORS middleware with options
app.use('/', route);
app.get("/getChats", (req, res) => {
    res.send("Hello World from chats");
});

mongoose.connect(process.env.dbURI).then(() => {
    console.log("DB connected successfully ")
}).catch((error) => {
    console.log("Problem while connecting with mongodb",error)
})

server.listen(process.env.port, () => {
    console.log('chat service is running at port', process.env.port)
})
// Connect to MongoDB