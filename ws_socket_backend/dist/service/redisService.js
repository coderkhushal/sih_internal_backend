"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const ioredis_1 = require("ioredis");
class RedisService {
    constructor() {
        this.redisClient = new ioredis_1.Redis(process.env.REDIS_URL.toString());
        this.redisClient.on('connect', () => {
            console.log("Redis Connected");
        });
    }
    static getInstance() {
        if (!RedisService.Instance) {
            RedisService.Instance = new RedisService();
        }
        return RedisService.Instance;
    }
}
exports.RedisService = RedisService;
