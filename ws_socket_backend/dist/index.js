"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const http = require('http');
const SocketService_1 = require("./service/SocketService");
const port = process.env.PORT || 4000;
const cors = require("cors");
//making httpserver and socket server
const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
SocketService_1.socketService.getInstance().io.attach(server);
//initialising listeners
SocketService_1.socketService.getInstance().initlisteners();
//handling routes
app.get("/health", (req, res) => {
    res.json({ "status": "healthy" });
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
