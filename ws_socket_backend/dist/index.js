"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const http = require('http');
const port = process.env.PORT || 4000;
const cors_1 = __importDefault(require("cors"));
const SocketService2_1 = require("./service/SocketService2");
//making httpserver and socket server
const app = express();
app.use(express.json());
app.use((0, cors_1.default)({
    allowedHeaders: ["*"],
    origin: "*"
}));
const server = http.createServer(app);
SocketService2_1.SocketService2.getInstance().io.attach(server);
//initialising listeners
SocketService2_1.SocketService2.getInstance().initlisteners();
//handling routes
app.get("/health", (req, res) => {
    SocketService2_1.SocketService2.getInstance().refreshRedisConnection();
    res.json({ "status": "healthy" });
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
