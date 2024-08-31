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
        this.redisSubscriber = new ioredis_1.Redis(process.env.REDIS_URL.toString());
        this.redisPublisher = new ioredis_1.Redis(process.env.REDIS_URL.toString());
        this.RedisBuffer = [];
        this.isRedisConnected = false;
        this._io = new socket_io_1.Server({
            cors: {
                origin: "*",
                methods: ["*"]
            }
        });
        this.connectToRedis();
    }
    connectToRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisPublisher.get("hello");
            yield this.redisSubscriber.get("hello");
            console.log("redis connected");
            this.isRedisConnected = true;
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
                // this.handlestatechange(socket.id, data)
                try {
                    const data = JSON.parse(d);
                    yield this.redisPublisher.publish(data.SpreadSheetId, JSON.stringify({ data: data.data, SpreadSheetId: data.SpreadSheetId }));
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
    subscribe(socketId, d) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const data = JSON.parse(d);
                if (!data.SpreadSheetId) {
                    return;
                }
                if ((_a = this.Subscriptions.get(socketId)) === null || _a === void 0 ? void 0 : _a.includes(data.SpreadSheetId)) {
                    return;
                }
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
            if (!data.SpreadSheetId) {
                return;
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
                if (((_a = this.reverseSubscriptions.get(data.SpreadSheetId)) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                    // if no user is subscribed to spreadsheetId , then unsubscribe from redis channel
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
        try {
            console.log(d);
            const data = JSON.parse(d);
            console.log("pushed to redis queue");
            let isPushed = true;
            if (isPushed) {
                const subscribers = this.reverseSubscriptions.get(data.SpreadSheetId);
                if (subscribers) {
                    subscribers.forEach(subscriber => {
                        this.io.to(subscriber).emit("STATE", data);
                    });
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
}
exports.socketService = socketService;
