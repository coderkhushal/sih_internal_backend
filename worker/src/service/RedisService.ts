import { Redis } from "ioredis";

export class RedisService {
    private static instance: RedisService;
    private redisClient: Redis
    private isRedisConnected = false
    private constructor() {

        this.redisClient = new Redis(process.env.REDIS_URL!.toString(),{ retryStrategy(){return 10} })
        this.ConnectToRedis()

        this.redisClient.on("close", () => {
            
            this.isRedisConnected = false
            this.ConnectToRedis()
        })
    }
    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService()
        }
        return RedisService.instance
    }

    public async ConnectToRedis() {
        if (this.redisClient == undefined || this.redisClient.status == "close") {
            this.redisClient = new Redis(process.env.REDIS_URL!.toString())
        }
        await this.redisClient.get("hello")
        this.isRedisConnected = true
    }
    public async PopFromQueue(queueName: string) {
        console.log("popping from queue restarted")
        await this.ConnectToRedis()



        while (this.isRedisConnected) {
            try {

                let result: string[] | null = await this.redisClient.brpop(queueName, 5)
                if (result) {

                    let data = JSON.parse(result[1])
                    console.log(data)
                }
            }
            catch (er) {
                console.log(er)

            }




        }

    }


}