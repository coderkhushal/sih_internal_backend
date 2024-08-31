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
require("dotenv").config();
const ioredis_1 = require("ioredis");
const sub = new ioredis_1.Redis(process.env.REDIS_URL.toString());
const pub = new ioredis_1.Redis(process.env.REDIS_URL.toString());
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield sub.set("hello", "world");
        yield sub.subscribe("abc", (err, count) => {
            if (err) {
                console.log(err);
            }
            console.log(count);
        });
        sub.on("message", (channel, message) => {
            console.log(channel, message);
        });
    });
}
main();
// because it's not in the subscriber mode.
