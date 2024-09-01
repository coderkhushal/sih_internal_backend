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
const redis_1 = require("redis");
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
        this.redisSubscriber = (0, redis_1.createClient)({ url: process.env.REDIS_URL.toString() });
        this.redisPublisher = (0, redis_1.createClient)({ url: process.env.REDIS_URL.toString() });
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
                yield this.redisPublisher.connect();
                yield this.redisSubscriber.connect();
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
            yield this.redisPublisher.lPush(queue, data);
        });
    }
    processRedisBuffer() {
        while (this.RedisBuffer.length > 0) {
            const item = this.RedisBuffer.shift();
            if ((item === null || item === void 0 ? void 0 : item.type) === "SUBSCRIBE") {
                this.redisSubscriber.subscribe(item.channel, (message, channel) => { console.log(message, channel); });
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
                    this.redisSubscriber.subscribe(data.SpreadSheetId, this.handleRedisMessage);
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
    handleRedisMessage(d, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(d);
                const data = JSON.parse(d);
                yield SocketService2.getInstance().redisPublisher.lPush("STATE", JSON.stringify(data));
                SocketService2.getInstance().io.to(data.SpreadSheetId).emit("STATE", data);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
}
exports.SocketService2 = SocketService2;
