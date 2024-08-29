import { Redis } from "ioredis";

export class RedisService {
    public static Instance : RedisService;
    redisClient : any
    private constructor(){
        this.redisClient = new Redis(process.env.REDIS_URL!.toString())
        this.redisClient.on('connect',()=>{
            console.log("Redis Connected")
        }
    )
    }
    public static getInstance(): RedisService {
        if (!RedisService.Instance) {
            RedisService.Instance = new RedisService();
        }

        return RedisService.Instance;
    }
    

}