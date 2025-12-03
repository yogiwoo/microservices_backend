const express=require("express");
const {createProxyMiddleware } =  require("http-proxy-middleware")
const app=express();

app.use("/auth",createProxyMiddleware({
    target:'http://auth:5005',
    changeOrigin:true,
   pathRewrite:{'^/auth':''}
}))

app.use("/chat",createProxyMiddleware({
    target:'http://chat:8080',
    changeOrigin:true,
        ws: true,      // Enable WebSocket support
     pathRewrite:{'^/chat':''}
}))

// Proxy socket.io path directly so websocket upgrade requests are forwarded
app.use(
    "/socket.io",
    createProxyMiddleware({
        target: "http://chat:8080",
        changeOrigin: true,
        ws: true,
        logLevel: 'debug'
    })
);

app.listen(8005,()=>{
    console.log('api gateway is active')
})
