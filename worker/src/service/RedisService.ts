import { Redis } from "ioredis";

export class RedisService {
    private static instance: RedisService;
    private isRedisConnected =false
    private redisClient = new Redis(process.env.REDIS_URL!.toString())
    private constructor(){
        this.ConnectToRedis()
    }
    public static getInstance(): RedisService{
        if(!RedisService.instance){
            RedisService.instance = new RedisService()
        }
        return RedisService.instance
    }

 private async ConnectToRedis(){
     await this.redisClient.get("hello")
     this.isRedisConnected = true 
 }
    public async PopFromQueue(queueName: string){
        console.log("popping from queue restarted")
            await this.ConnectToRedis()
        
        
             
        while(this.isRedisConnected ){
            try{

                let result = await this.redisClient.brpop(queueName, 0)
                
                console.log(result)
            }
            catch(er){
            console.log(er)

        }
        
    
    
    
    }

    }
    public async restartPulling(){
        this.redisClient.disconnect()
        this.isRedisConnected = false
        this.PopFromQueue("STATE")
    }

}