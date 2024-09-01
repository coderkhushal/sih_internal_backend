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
exports.SocketService2 = void 0;
require('dotenv').config();
const ioredis_1 = require("ioredis");
const socket_io_1 = require("socket.io");
class SocketService2 {
    constructor() {
        this.RedisBuffer = [];
        this.isRedisConnected = false;
        this.io = new socket_io_1.Server({
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
    refreshRedisConnection() {
        console.log("Refreshing Redis connections...");
        this.redisPublisher.disconnect();
        this.redisSubscriber.disconnect();
        setTimeout(() => this.connectToRedis(), 1000); // Delay reconnection attempts slightly
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
    static getInstance() {
        if (!SocketService2.instance) {
            SocketService2.instance = new SocketService2();
        }
        return SocketService2.instance;
    }
    initlisteners() {
        this.io.on('connection', (socket) => {
            socket.on("SUBSCRIBE", (data) => {
                this.subscribe(socket, socket.id, data);
            });
            socket.on("UNSUBSCRIBE", (data) => {
                this.unsubscribe(socket, socket.id, data);
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
    subscribe(socket, socketId, d) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const data = JSON.parse(d);
                if (!data.SpreadSheetId)
                    return;
                socket.join(data.SpreadSheetId);
                // if room has a new user, subscribe to redis
                if (((_a = this.io.sockets.adapter.rooms.get(data.SpreadSheetId)) === null || _a === void 0 ? void 0 : _a.size) == 1) {
                    this.redisSubscriber.subscribe(data.SpreadSheetId);
                    console.log("subscribed to redis for " + data.SpreadSheetId);
                    this.redisSubscriber.on("message", this.handleRedisMessage);
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    unsubscribe(socket, socketId, d) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const data = JSON.parse(d);
                if (!data.SpreadSheetId)
                    return;
                socket.leave(data.SpreadSheetId);
                console.log(this.io);
                if (((_a = this.io.sockets.adapter.rooms.get(data.SpreadSheetId)) === null || _a === void 0 ? void 0 : _a.size) == 0) {
                    this.redisSubscriber.unsubscribe(data.SpreadSheetId);
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    handleRedisMessage(channel, d) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(d);
                const data = JSON.parse(d);
                console.log(this.io);
                SocketService2.getInstance().io.to(data.SpreadSheetId).emit("STATE", data);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
}
exports.SocketService2 = SocketService2;
