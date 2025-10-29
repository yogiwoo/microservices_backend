/*
    this instance shoud be connected with redis docker container 
    the redis service is initialized in docker compose yaml file on port 6379
*/
const {createClient}=require("redis");

const client = createClient({
    url: 'redis://redis:6379'
});

async function redisConnection (){
    try {
        client.on('error',error=>console.log("redis connection error",error));
        client.on('connect', ()=>console.log("Redis Client Connecting..."));
        client.on('ready', ()=>console.log("Redis Client Ready!"));
        
        await client.connect();
        console.log("connected to redis cache successfully");
        return client;
    } catch (error) {
        console.log("Redis connection failed:", error);
        throw error;
    }
}

// Export both the client instance nd the connection function
module.exports={redisConnection, client};