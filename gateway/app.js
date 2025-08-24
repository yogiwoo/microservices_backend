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
  //  ws: true,      // Enable WebSocket support
   pathRewrite:{'^/chat':''}
}))

// app.use(
//   "/socket.io",
//   createProxyMiddleware({
//     target: "http://chat:8080",
//     changeOrigin: true,
//     ws: true,
//      pathRewrite:{'^/chat':''}
//   })
// );

app.listen(8005,()=>{
    console.log('api gateway is active')
})
