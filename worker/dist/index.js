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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv").config();
const body_parser_1 = __importDefault(require("body-parser"));
const RedisService_1 = require("./service/RedisService");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Middleware to handle JSON responses
let isRunning = false;
app.get('/', (req, res) => {
    if (isRunning) {
        res.send('Redis Queue Pulling Server restarting');
        RedisService_1.RedisService.getInstance().restartPulling();
    }
    else {
        res.send('Redis Queue Pulling Server starting!');
        RedisService_1.RedisService.getInstance().PopFromQueue("STATE");
        isRunning = true;
    }
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            RedisService_1.RedisService.getInstance().PopFromQueue("STATE");
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log(`Server is listening on port ${PORT}`);
            });
        }
        catch (err) {
            console.log(err);
        }
    });
}
main();
