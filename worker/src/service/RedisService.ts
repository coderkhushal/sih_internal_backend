import { Redis } from "ioredis";
import { DbManager } from "../utils/db";

export class RedisService {
    private static instance: RedisService;
    private redisClient : Redis
    private isRedisConnected =false
    private constructor(){

        this.redisClient= new Redis(process.env.REDIS_URL!.toString(), { keepAlive: 800000})
        this.ConnectToRedis()

    this.redisClient.on("close", ()=>{
        console.log("closing")
        this.isRedisConnected = false
        this.ConnectToRedis()
    })
    }
    public static getInstance(): RedisService{
        if(!RedisService.instance){
            RedisService.instance = new RedisService()
        }
        return RedisService.instance
    }

 public  async ConnectToRedis(){
    if(this.redisClient==undefined || this.redisClient.status == "close"){
        this.redisClient= new Redis(process.env.REDIS_URL!.toString(), { keepAlive: 800000})
    }
     await this.redisClient.get("hello")
     this.isRedisConnected = true 
 }
    public async PopFromQueue(queueName: string){
        console.log("popping from queue restarted")
            await this.ConnectToRedis()
        
        
             
        while(this.isRedisConnected ){
            try{

                let d : string[] | null = await this.redisClient.brpop(queueName, 0)
                if(!d){
                    continue;
                }
                let result = JSON.parse(d[1])

                await DbManager.getInstance().UpdateSpreadSheetData(Number.parseInt(result.SpreadSheetId), Number.parseInt(result.SheetId), Number.parseInt(result.UserId), result.data)
                
            }
            catch(er){
            console.log(er)

        }
        
    
    
    
    }

    }


}