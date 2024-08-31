
import express from 'express';
import { Request, Response } from 'express';
import cors from "cors"
require("dotenv").config()
import bodyParser from 'body-parser';
import { RedisService } from './service/RedisService';
const app = express()
app.use(express.json())
app.use(cors({
    credentials: true,
    
}));
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

// Middleware to handle JSON responses
let isRunning = false
app.get('/', (req, res) => {
    if (isRunning){

        res.send('Redis Queue Pulling Server restarting');
        RedisService.getInstance().restartPulling()
    }
     else{
        res.send('Redis Queue Pulling Server starting!');
        RedisService.getInstance().PopFromQueue("STATE")
        isRunning =true
        
        }
});



async function main(){
    try{
        RedisService.getInstance().PopFromQueue("STATE")
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
        
    }
    catch(err){
        console.log(err)
    }
}
main()