import { Request, Response } from "express";

const express = require('express');
const http = require('http');

const port = process.env.PORT || 4000;
import cors from "cors"
import { SocketService2 } from "./service/SocketService2";
//making httpserver and socket server
const app = express();
app.use(express.json())
app.use(cors({
  allowedHeaders:["*"],
  origin:"*"
}))
const server = http.createServer(app);
SocketService2.getInstance().io.attach(server)
//initialising listeners
 
SocketService2.getInstance().initlisteners()

//handling routes
app.get("/health",(req: Request,res: Response)=>{
  SocketService2.getInstance().refreshRedisConnection()
  res.json({"status":"healthy"})
})
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});