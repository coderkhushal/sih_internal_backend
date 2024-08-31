import { Server } from "socket.io";
import { InStateData, Indata } from "../types";
import { Redis } from "ioredis";
require("dotenv").config()
export class socketService {
    private static instance: socketService;
    private socket: any;
    private Subscriptions: Map<string, string[]> = new Map()
    private reverseSubscriptions: Map<string, string[]> = new Map()
    private redisSubscriber: Redis
    private redisPublisher: Redis
    private RedisBuffer: { type: "SUBSCRIBE" | "UNSUBSCRIBE", channel: string }[] = []
    private isRedisConnected = false
    private _io = new Server({
        cors: {
            origin: "*",
            methods: ["*"]
        }
    })
    private constructor() {

        this.redisSubscriber = new Redis(process.env.REDIS_URL!.toString()),
        this.redisPublisher = new Redis(process.env.REDIS_URL!.toString())
        this.connectToRedis()
    }
    async connectToRedis() {
        if (this.redisSubscriber.status == "close" || this.redisSubscriber.status == "end" || !this.redisSubscriber) {

            this.redisSubscriber = new Redis(process.env.REDIS_URL!.toString()) 
        }
        if (!this.redisPublisher || this.redisPublisher.status=="end" || this.redisPublisher.status == "close") {
            this.redisPublisher = new Redis(process.env.REDIS_URL!.toString(), { keepAlive: 800000 })
        }

        await this.redisPublisher.get("hello")
        await this.redisSubscriber.get("hello")
        console.log("redis connected")
        this.isRedisConnected = true
    }
    get io() {
        return this._io
    }
    public static getInstance(): socketService {
        if (!socketService.instance) {
            socketService.instance = new socketService();
        }

        return socketService.instance;
    }
    public initlisteners() {

        this.io.on('connection', (socket) => {

            socket.on("SUBSCRIBE", (data: string) => {
                this.subscribe(socket.id, data)
            })
            socket.on("UNSUBSCRIBE", (data: string) => {
                this.unsubscribe(socket.id, data)
            })
            socket.on("STATE", async (d: string) => {
                // this.handlestatechange(socket.id, data)
                try {

                    const data = JSON.parse(d)

                    await this.redisPublisher.publish(data.SpreadSheetId, JSON.stringify(data))
                }
                catch (er) {
                    console.log(er)
                }
            })
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
    public getSocket() {
        return this.socket;
    }
    public refreshRedisConnection() {
        this.redisPublisher.disconnect()
        this.redisSubscriber.disconnect()
        this.connectToRedis()
    }
    private async subscribe(socketId: string, d: string) {

        try {
            const data: Indata = JSON.parse(d)



            if (!data.SpreadSheetId) {

                return
            }

            if (this.Subscriptions.get(socketId)?.includes(data.SpreadSheetId)) {
                return
            }


            this.Subscriptions.set(socketId, [...(this.Subscriptions.get(socketId) || []), data.SpreadSheetId])

            this.reverseSubscriptions.set(data.SpreadSheetId, [...(this.reverseSubscriptions.get(data.SpreadSheetId) || []), socketId])
            if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length == 1) {

                console.log("subscribe to redis for " + data.SpreadSheetId)
                if (this.isRedisConnected) {
                    await this.redisSubscriber.subscribe(data.SpreadSheetId)
                    this.redisSubscriber.on("message", (channel: string, data: string,) => {
                        this.handlestatechange(channel, data)


                    })

                }
                else {
                    this.RedisBuffer.push({ type: "SUBSCRIBE", channel: data.SpreadSheetId })
                }
            }

        }
        catch (err) {
            console.log(err)
        }
    }

    private unsubscribe(socketId: string, d: string) {
        try {

            const data: Indata = JSON.parse(d)
            if (!data.SpreadSheetId) {
                return
            }

            const subscriptions = this.Subscriptions.get(socketId);
            if (subscriptions) {
                this.Subscriptions.set(socketId, subscriptions.filter(s => s !== data.SpreadSheetId));
            }
            const reverseSubscriptions = this.reverseSubscriptions.get(data.SpreadSheetId);
            if (reverseSubscriptions) {
                // remove user's subscription

                this.reverseSubscriptions.set(data.SpreadSheetId, reverseSubscriptions.filter(s => s !== socketId));
                // remove user from spreadsheet's subscribers
                if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length === 0) {
                    // if no user is subscribed to spreadsheetId , then unsubscribe from redis channel
                    this.reverseSubscriptions.delete(data.SpreadSheetId);
                    this.redisSubscriber.unsubscribe(data.SpreadSheetId)
                    console.log("unsubscribe to redis for " + data.SpreadSheetId)
                }
            }
        }
        catch (err) {
            console.log(err)
        }

    }
    private async handlestatechange(channel: string, d: string) {

        try {
            console.log(d)
            const data: InStateData = JSON.parse(d)


            await this.pushToRedisQueue("STATE", JSON.stringify(data))
            console.log("pushed to redis queue")
            let isPushed = true
            if (isPushed) {
                const subscribers = this.reverseSubscriptions.get(data.SpreadSheetId)

                if (subscribers) {
                    subscribers.forEach(subscriber => {

                        this.io.to(subscriber).emit("STATE", data)
                    })
                }
            }

        }
        catch (err) {
            console.log(err)
        }
    }
    private async pushToRedisQueue(queue: string, data: string) {
        await this.redisPublisher.lpush(queue, data)

    }
}