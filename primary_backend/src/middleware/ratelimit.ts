const rateLimit = require("express-rate-limit");

export const ratelimiter = rateLimit({
    windowMs:  1000,
    max: 1,
    message: "Too many requests, please try again later",
    headers: true,
    statusCode: 429
});