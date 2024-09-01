"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const ioredis_1 = require("ioredis");
require("dotenv").config();
class socketService {
    constructor() {
        this.Subscriptions = new Map();
        this.reverseSubscriptions = new Map();
        this.RedisBuffer = [];
        this.isRedisConnected = false;
        this._io = new socket_io_1.Server({
            cors: {
                origin: "*",
                methods: ["*"]
            }
        });
        this.redisSubscriber = new ioredis_1.Redis(process.env.REDIS_URL.toString(), {
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            }
        });
        this.redisPublisher = new ioredis_1.Redis(process.env.REDIS_URL.toString(), {
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            }
        });
        this.setupRedisListeners();
        this.connectToRedis();
    }
    setupRedisListeners() {
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
        this.redisSubscriber.on('reconnecting', (time) => {
            console.log(`Redis Subscriber reconnecting in ${time} ms`);
        });
        this.redisPublisher.on('reconnecting', (time) => {
            console.log(`Redis Publisher reconnecting in ${time} ms`);
        });
    }
    connectToRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.redisSubscriber.status === "close" || this.redisSubscriber.status === "end") {
                    this.redisSubscriber = new ioredis_1.Redis(process.env.REDIS_URL.toString(), {
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        }
                    });
                }
                if (this.redisPublisher.status === "close" || this.redisPublisher.status === "end") {
                    this.redisPublisher = new ioredis_1.Redis(process.env.REDIS_URL.toString(), {
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        }
                    });
                }
                yield Promise.all([this.redisPublisher.get("hello"), this.redisSubscriber.get("hello")]);
                console.log("Redis connected");
                this.isRedisConnected = true;
                this.processRedisBuffer();
            }
            catch (err) {
                console.error("Failed to connect to Redis:", err);
                this.refreshRedisConnection();
            }
        });
    }
    get io() {
        return this._io;
    }
    static getInstance() {
        if (!socketService.instance) {
            socketService.instance = new socketService();
        }
        return socketService.instance;
    }
    initlisteners() {
        this.io.on('connection', (socket) => {
            socket.on("SUBSCRIBE", (data) => {
                this.subscribe(socket.id, data);
            });
            socket.on("UNSUBSCRIBE", (data) => {
                this.unsubscribe(socket.id, data);
            });
            socket.on("STATE", (d) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const data = JSON.parse(d);
                    yield this.redisPublisher.publish(data.SpreadSheetId, JSON.stringify(data));
                }
                catch (er) {
                    console.log(er);
                }
            }));
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
    getSocket() {
        return this.socket;
    }
    refreshRedisConnection() {
        console.log("Refreshing Redis connections...");
        this.redisPublisher.disconnect();
        this.redisSubscriber.disconnect();
        setTimeout(() => this.connectToRedis(), 1000); // Delay reconnection attempts slightly
    }
    subscribe(socketId, d) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const data = JSON.parse(d);
                if (!data.SpreadSheetId)
                    return;
                if ((_a = this.Subscriptions.get(socketId)) === null || _a === void 0 ? void 0 : _a.includes(data.SpreadSheetId))
                    return;
                this.Subscriptions.set(socketId, [...(this.Subscriptions.get(socketId) || []), data.SpreadSheetId]);
                this.reverseSubscriptions.set(data.SpreadSheetId, [...(this.reverseSubscriptions.get(data.SpreadSheetId) || []), socketId]);
                if (((_b = this.reverseSubscriptions.get(data.SpreadSheetId)) === null || _b === void 0 ? void 0 : _b.length) == 1) {
                    console.log("subscribe to redis for " + data.SpreadSheetId);
                    if (this.isRedisConnected) {
                        yield this.redisSubscriber.subscribe(data.SpreadSheetId);
                        this.redisSubscriber.on("message", (channel, data) => {
                            this.handlestatechange(channel, data);
                        });
                    }
                    else {
                        this.RedisBuffer.push({ type: "SUBSCRIBE", channel: data.SpreadSheetId });
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    unsubscribe(socketId, d) {
        var _a;
        try {
            const data = JSON.parse(d);
            if (!data.SpreadSheetId)
                return;
            const subscriptions = this.Subscriptions.get(socketId);
            if (subscriptions) {
                this.Subscriptions.set(socketId, subscriptions.filter(s => s !== data.SpreadSheetId));
            }
            const reverseSubscriptions = this.reverseSubscriptions.get(data.SpreadSheetId);
            if (reverseSubscriptions) {
                this.reverseSubscriptions.set(data.SpreadSheetId, reverseSubscriptions.filter(s => s !== socketId));
                if (((_a = this.reverseSubscriptions.get(data.SpreadSheetId)) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                    this.reverseSubscriptions.delete(data.SpreadSheetId);
                    this.redisSubscriber.unsubscribe(data.SpreadSheetId);
                    console.log("unsubscribe to redis for " + data.SpreadSheetId);
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    handlestatechange(channel, d) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(d);
                const data = JSON.parse(d);
                yield this.pushToRedisQueue("STATE", JSON.stringify(data));
                console.log("pushed to redis queue");
                const subscribers = this.reverseSubscriptions.get(data.SpreadSheetId);
                if (subscribers) {
                    subscribers.forEach(subscriber => {
                        this.io.to(subscriber).emit("STATE", data);
                    });
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    pushToRedisQueue(queue, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisPublisher.lpush(queue, data);
        });
    }
    processRedisBuffer() {
        while (this.RedisBuffer.length > 0) {
            const item = this.RedisBuffer.shift();
            if ((item === null || item === void 0 ? void 0 : item.type) === "SUBSCRIBE") {
                this.redisSubscriber.subscribe(item.channel);
            }
            else if ((item === null || item === void 0 ? void 0 : item.type) === "UNSUBSCRIBE") {
                this.redisSubscriber.unsubscribe(item.channel);
            }
        }
    }
}
exports.socketService = socketService;
