const express=require("express");
const {createProxyMiddleware } =  require("http-proxy-middleware")
const app=express();

app.use("/auth",createProxyMiddleware({
    target:'http://localhost:5005',
    changeOrigin:true,
   pathRewrite:{'^/auth':''}
}))

app.use("/chat",createProxyMiddleware({
    target:'http://localhost:8080',
    changeOrigin:true,
   pathRewrite:{'^/chat':''}
}))

app.listen(4040,()=>{
    console.log('api gateway is active')
})
