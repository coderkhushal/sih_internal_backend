"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratelimiter = void 0;
const rateLimit = require("express-rate-limit");
exports.ratelimiter = rateLimit({
    windowMs: 1000,
    max: 1,
    message: "Too many requests, please try again later",
    headers: true,
    statusCode: 429
});
