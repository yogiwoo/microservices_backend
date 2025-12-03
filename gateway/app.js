const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use("/auth", createProxyMiddleware({
    target: 'http://auth:5005',
    changeOrigin: true,
    pathRewrite: { '^/auth': '' }
}))

// Chat API - REGULAR HTTP ONLY (no WebSocket!)
app.use("/chat", createProxyMiddleware({
    target: 'http://chat:8080',
    changeOrigin: true,
    ws: false,  // IMPORTANT: Disable WebSocket here
    pathRewrite: { '^/chat': '' }
}))

// Socket.io proxy - HANDLES WEB SOCKETS ONLY
app.use("/socket.io", createProxyMiddleware({
    target: 'http://chat:8080',
    changeOrigin: true,
    ws: true,
    logLevel: 'debug'
}))

app.listen(8005, () => {
    console.log('api gateway is active')
});