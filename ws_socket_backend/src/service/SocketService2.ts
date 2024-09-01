require('dotenv').config();
import { Redis } from "ioredis";
import { RedisClientType, createClient } from "redis";

import { Server, Socket } from "socket.io";
import { Indata } from "../types";

export class SocketService2{

    private static instance:SocketService2;
    private redisSubscriber: RedisClientType;
    private redisPublisher: RedisClientType;
    private RedisBuffer: { type: "SUBSCRIBE" | "UNSUBSCRIBE", channel: string }[] = [];
    private isRedisConnected = false;
    public io = new Server({
        cors: {
            origin: "*",
            methods: ["*"]
        }
    });

    private constructor() {
        this.redisSubscriber =  createClient({url: process.env.REDIS_URL!.toString()});

        this.redisPublisher = createClient({url: process.env.REDIS_URL!.toString()});

        this.setupRedisListeners();
        this.connectToRedis();
    }

    private setupRedisListeners() {
        this.redisSubscriber.on('error', (err) => {
            console.error('Redis Subscriber Error:', err);
            this.isRedisConnected = false;
            this.refreshRedisConnection();
        });

        this.redisPublisher.on('error', (err) => {
            console.error('Redis Publisher Error:', err);
            this.isRedisConnected = false;
            this.refreshRedisConnection();
        });

        this.redisSubscriber.on('connect', () => {
            console.log('Redis Subscriber connected');
            this.isRedisConnected = true;
            this.processRedisBuffer();
        });

        this.redisPublisher.on('connect', () => {
            console.log('Redis Publisher connected');
            this.isRedisConnected = true;
            this.processRedisBuffer();
        });

        // Handle Redis close events
        this.redisSubscriber.on('end', () => {
            console.log('Redis Subscriber connection closed');
            this.isRedisConnected = false;
            this.refreshRedisConnection();
        });

        this.redisPublisher.on('end', () => {
            console.log('Redis Publisher connection closed');
            this.isRedisConnected = false;
            this.refreshRedisConnection();
        });

        // Handle Redis reconnection attempts
        this.redisSubscriber.on('reconnecting', (time:any) => {
            console.log(`Redis Subscriber reconnecting in ${time} ms`);
        });

        this.redisPublisher.on('reconnecting', (time: any) => {
            console.log(`Redis Publisher reconnecting in ${time} ms`);
        });
    }

    public refreshRedisConnection() {
        console.log("Refreshing Redis connections...");
        this.redisPublisher.disconnect();
        this.redisSubscriber.disconnect();
        setTimeout(() => this.connectToRedis(), 1000);  // Delay reconnection attempts slightly
    }
    async connectToRedis() {
        try {
            

            await this.redisPublisher.connect() 
            await this.redisSubscriber.connect()
            await Promise.all([this.redisPublisher.get("hello"), this.redisSubscriber.get("hello")]);
            console.log("Redis connected");
            this.isRedisConnected = true;
            this.processRedisBuffer();
        } catch (err) {
            console.error("Failed to connect to Redis:", err);
            this.refreshRedisConnection();
        }
    }


    public static getInstance(): SocketService2 {
        if (!SocketService2.instance) {
            SocketService2.instance = new SocketService2();
        }
        return SocketService2.instance;
    }

    public initlisteners() {
        this.io.on('connection', (socket) => {
            socket.on("SUBSCRIBE", (data: string) => {
                this.subscribe(socket, socket.id, data);
            });

            socket.on("UNSUBSCRIBE", (data: string) => {
                this.unsubscribe(socket, socket.id, data);
            });

            socket.on("STATE", async (d: string) => {
                try {
                    const data = JSON.parse(d);
                    await this.redisPublisher.publish(data.SpreadSheetId, JSON.stringify(data));
                } catch (er) {
                    console.log(er);
                }
            });

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }

    private async pushToRedisQueue(queue: string, data: string) {
        await this.redisPublisher.lPush(queue, data);
    }

    private processRedisBuffer() {
        while (this.RedisBuffer.length > 0) {
            const item = this.RedisBuffer.shift();
            if (item?.type === "SUBSCRIBE") {
                this.redisSubscriber.subscribe(item.channel, (message, channel)=>{console.log(message, channel)});
            } else if (item?.type === "UNSUBSCRIBE") {
                this.redisSubscriber.unsubscribe(item.channel);
            }
        }
    }

    private async subscribe(socket: Socket, socketId: string, d: string) {
        try {
            const data: Indata = JSON.parse(d);
            if (!data.SpreadSheetId) return;
            socket.join(data.SpreadSheetId)
            // if room has a new user, subscribe to redis
            await this.pushToRedisQueue("STATE", JSON.stringify(data))
            if(this.io.sockets.adapter.rooms.get(data.SpreadSheetId)?.size == 1){
                this.redisSubscriber.subscribe(data.SpreadSheetId,this.handleRedisMessage);
                
                
            }

        } catch (err) {
            console.error(err);
        }
    }        
    private async unsubscribe(socket : Socket, socketId: string, d: string) {
        try {
            const data: Indata = JSON.parse(d);
            if (!data.SpreadSheetId) return;
            socket.leave(data.SpreadSheetId)
            console.log(this.io)
            if(this.io.sockets.adapter.rooms.get(data.SpreadSheetId)?.size == 0){
                this.redisSubscriber.unsubscribe(data.SpreadSheetId);
                
            }
            
        } catch (err) {
            console.error(err);
        }

    }
    private async handleRedisMessage( d: string, channel: string) {
        try {
            console.log(d);
            const data: Indata = JSON.parse(d);
            
            SocketService2.getInstance().io.to(data.SpreadSheetId).emit("STATE", data);
        } catch (err) {
            console.error(err);
        }
    }
}