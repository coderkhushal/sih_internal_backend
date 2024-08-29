import { Request, Response } from "express";

const express = require('express');
const http = require('http');
import {socketService} from "./service/SocketService"
const port = process.env.PORT || 4000;
const cors= require("cors")

//making httpserver and socket server
const app = express();
app.use(express.json())
app.use(cors())
const server = http.createServer(app);
socketService.getInstance().io.attach(server)
//initialising listeners
socketService.getInstance().initlisteners() 

//handling routes
app.get("/health",(req: Request,res: Response)=>{
  res.json({"status":"healthy"})
})
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});