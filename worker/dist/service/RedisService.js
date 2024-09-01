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
exports.RedisService = void 0;
const ioredis_1 = require("ioredis");
const db_1 = require("../utils/db");
class RedisService {
    constructor() {
        this.isRedisConnected = false;
        this.redisClient = new ioredis_1.Redis(process.env.REDIS_URL.toString(), { keepAlive: 800000 });
        this.ConnectToRedis();
        this.redisClient.on("close", () => {
            console.log("closing");
            this.isRedisConnected = false;
            this.ConnectToRedis();
        });
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    ConnectToRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.redisClient == undefined || this.redisClient.status == "close") {
                this.redisClient = new ioredis_1.Redis(process.env.REDIS_URL.toString(), { keepAlive: 800000 });
            }
            yield this.redisClient.get("hello");
            this.isRedisConnected = true;
        });
    }
    PopFromQueue(queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("popping from queue restarted");
            yield this.ConnectToRedis();
            while (this.isRedisConnected) {
                try {
                    let d = yield this.redisClient.brpop(queueName, 0);
                    if (!d) {
                        continue;
                    }
                    let result = JSON.parse(d[1]);
                    db_1.DbManager.getInstance().UpdateSpreadSheetData(Number.parseInt(result.SpreadSheetId), Number.parseInt(result.SheetId), Number.parseInt(result.UserId), result.data);
                }
                catch (er) {
                    console.log(er);
                }
            }
        });
    }
}
exports.RedisService = RedisService;
