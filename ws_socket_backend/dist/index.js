"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const http = require('http');
const SocketService_1 = require("./service/SocketService");
const port = process.env.PORT || 4000;
const cors_1 = __importDefault(require("cors"));
//making httpserver and socket server
const app = express();
app.use(express.json());
app.use((0, cors_1.default)());
const server = http.createServer(app);
SocketService_1.socketService.getInstance().io.attach(server);
//initialising listeners
SocketService_1.socketService.getInstance().initlisteners();
//handling routes
app.get("/health", (req, res) => {
    SocketService_1.socketService.getInstance().refreshRedisConnection();
    res.json({ "status": "healthy" });
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
