"use strict";
// import { Server } from "socket.io";
// import { InStateData, Indata } from "../types";
// import { Redis } from "ioredis";
// require("dotenv").config();
// export class socketService {
//     private static instance: socketService;
//     private socket: any;
//     private Subscriptions: Map<string, string[]> = new Map();
//     private reverseSubscriptions: Map<string, string[]> = new Map();
//     private redisSubscriber: Redis;
//     private redisPublisher: Redis;
//     private RedisBuffer: { type: "SUBSCRIBE" | "UNSUBSCRIBE", channel: string }[] = [];
//     private isRedisConnected = false;
//     private _io = new Server({
//         cors: {
//             origin: "*",
//             methods: ["*"]
//         }
//     });
//     private constructor() {
//         this.redisSubscriber = new Redis(process.env.REDIS_URL!.toString(), {
//             retryStrategy(times) {
//                 return Math.min(times * 50, 2000);
//             }
//         });
//         this.redisPublisher = new Redis(process.env.REDIS_URL!.toString(), {
//             retryStrategy(times) {
//                 return Math.min(times * 50, 2000);
//             }
//         });
//         this.setupRedisListeners();
//         this.connectToRedis();
//     }
//     private setupRedisListeners() {
//         this.redisSubscriber.on('error', (err) => {
//             console.error('Redis Subscriber Error:', err);
//             this.isRedisConnected = false;
//             this.refreshRedisConnection();
//         });
//         this.redisPublisher.on('error', (err) => {
//             console.error('Redis Publisher Error:', err);
//             this.isRedisConnected = false;
//             this.refreshRedisConnection();
//         });
//         this.redisSubscriber.on('connect', () => {
//             console.log('Redis Subscriber connected');
//             this.isRedisConnected = true;
//             this.processRedisBuffer();
//         });
//         this.redisPublisher.on('connect', () => {
//             console.log('Redis Publisher connected');
//             this.isRedisConnected = true;
//             this.processRedisBuffer();
//         });
//         // Handle Redis close events
//         this.redisSubscriber.on('end', () => {
//             console.log('Redis Subscriber connection closed');
//             this.isRedisConnected = false;
//             this.refreshRedisConnection();
//         });
//         this.redisPublisher.on('end', () => {
//             console.log('Redis Publisher connection closed');
//             this.isRedisConnected = false;
//             this.refreshRedisConnection();
//         });
//         // Handle Redis reconnection attempts
//         this.redisSubscriber.on('reconnecting', (time:any) => {
//             console.log(`Redis Subscriber reconnecting in ${time} ms`);
//         });
//         this.redisPublisher.on('reconnecting', (time: any) => {
//             console.log(`Redis Publisher reconnecting in ${time} ms`);
//         });
//     }
//     async connectToRedis() {
//         try {
//             if (this.redisSubscriber.status === "close" || this.redisSubscriber.status === "end") {
//                 this.redisSubscriber = new Redis(process.env.REDIS_URL!.toString(), {
//                     retryStrategy(times) {
//                         return Math.min(times * 50, 2000);
//                     }
//                 });
//             }
//             if (this.redisPublisher.status === "close" || this.redisPublisher.status === "end") {
//                 this.redisPublisher = new Redis(process.env.REDIS_URL!.toString(), {
//                     retryStrategy(times) {
//                         return Math.min(times * 50, 2000);
//                     }
//                 });
//             }
//             await Promise.all([this.redisPublisher.get("hello"), this.redisSubscriber.get("hello")]);
//             console.log("Redis connected");
//             this.isRedisConnected = true;
//             this.processRedisBuffer();
//         } catch (err) {
//             console.error("Failed to connect to Redis:", err);
//             this.refreshRedisConnection();
//         }
//     }
//     get io() {
//         return this._io;
//     }
//     public static getInstance(): socketService {
//         if (!socketService.instance) {
//             socketService.instance = new socketService();
//         }
//         return socketService.instance;
//     }
//     public initlisteners() {
//         this.io.on('connection', (socket) => {
//             socket.on("SUBSCRIBE", (data: string) => {
//                 this.subscribe(socket.id, data);
//             });
//             socket.on("UNSUBSCRIBE", (data: string) => {
//                 this.unsubscribe(socket.id, data);
//             });
//             socket.on("STATE", async (d: string) => {
//                 try {
//                     const data = JSON.parse(d);
//                     await this.redisPublisher.publish(data.SpreadSheetId, JSON.stringify(data));
//                 } catch (er) {
//                     console.log(er);
//                 }
//             });
//             socket.on('disconnect', () => {
//                 console.log('user disconnected');
//             });
//         });
//     }
//     public getSocket() {
//         return this.socket;
//     }
//     public refreshRedisConnection() {
//         console.log("Refreshing Redis connections...");
//         this.redisPublisher.disconnect();
//         this.redisSubscriber.disconnect();
//         setTimeout(() => this.connectToRedis(), 1000);  // Delay reconnection attempts slightly
//     }
//     private async subscribe(socketId: string, d: string) {
//         try {
//             const data: Indata = JSON.parse(d);
//             if (!data.SpreadSheetId) return;
//             if (this.Subscriptions.get(socketId)?.includes(data.SpreadSheetId)) return;
//             this.Subscriptions.set(socketId, [...(this.Subscriptions.get(socketId) || []), data.SpreadSheetId]);
//             this.reverseSubscriptions.set(data.SpreadSheetId, [...(this.reverseSubscriptions.get(data.SpreadSheetId) || []), socketId]);
//             if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length == 1) {
//                 console.log("subscribe to redis for " + data.SpreadSheetId);
//                 if (this.isRedisConnected) {
//                     await this.redisSubscriber.subscribe(data.SpreadSheetId);
//                     this.redisSubscriber.on("message", (channel: string, data: string) => {
//                         this.handlestatechange(channel, data);
//                     });
//                 } else {
//                     this.RedisBuffer.push({ type: "SUBSCRIBE", channel: data.SpreadSheetId });
//                 }
//             }
//         } catch (err) {
//             console.log(err);
//         }
//     }
//     private unsubscribe(socketId: string, d: string) {
//         try {
//             const data: Indata = JSON.parse(d);
//             if (!data.SpreadSheetId) return;
//             const subscriptions = this.Subscriptions.get(socketId);
//             if (subscriptions) {
//                 this.Subscriptions.set(socketId, subscriptions.filter(s => s !== data.SpreadSheetId));
//             }
//             const reverseSubscriptions = this.reverseSubscriptions.get(data.SpreadSheetId);
//             if (reverseSubscriptions) {
//                 this.reverseSubscriptions.set(data.SpreadSheetId, reverseSubscriptions.filter(s => s !== socketId));
//                 if (this.reverseSubscriptions.get(data.SpreadSheetId)?.length === 0) {
//                     this.reverseSubscriptions.delete(data.SpreadSheetId);
//                     this.redisSubscriber.unsubscribe(data.SpreadSheetId);
//                     console.log("unsubscribe to redis for " + data.SpreadSheetId);
//                 }
//             }
//         } catch (err) {
//             console.log(err);
//         }
//     }
//     private async handlestatechange(channel: string, d: string) {
//         try {
//             console.log(d);
//             const data: InStateData = JSON.parse(d);
//             await this.pushToRedisQueue("STATE", JSON.stringify(data));
//             console.log("pushed to redis queue");
//             const subscribers = this.reverseSubscriptions.get(data.SpreadSheetId);
//             if (subscribers) {
//                 subscribers.forEach(subscriber => {
//                    this.io.to(subscriber).emit("STATE", data);
//                 });
//             }
//         } catch (err) {
//             console.log(err);
//         }
//     }
//     private async pushToRedisQueue(queue: string, data: string) {
//         await this.redisPublisher.lpush(queue, data);
//     }
//     private processRedisBuffer() {
//         while (this.RedisBuffer.length > 0) {
//             const item = this.RedisBuffer.shift();
//             if (item?.type === "SUBSCRIBE") {
//                 this.redisSubscriber.subscribe(item.channel);
//             } else if (item?.type === "UNSUBSCRIBE") {
//                 this.redisSubscriber.unsubscribe(item.channel);
//             }
//         }
//     }
// }
