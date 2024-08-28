"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_1 = require("../handlers/v1/post");
const postauth_1 = require("../middleware/postauth");
const router = express_1.default.Router();
router.post("/create", postauth_1.PostAuth, post_1.handleCreatePost);
// handle query on get request
router.get("/", postauth_1.PostAuth, post_1.handleGetPosts);
module.exports = router;
