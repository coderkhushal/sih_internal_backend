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
exports.handleGetPosts = exports.handleCreatePost = void 0;
const client_1 = require("@prisma/client");
let prisma = new client_1.PrismaClient();
const handleCreatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { title, content } = req.body;
        if (!title || !content) {
            console.log(title, content);
            return res.status(400).json({ message: "All fields are required" });
        }
        let post = yield prisma.post.create({
            data: {
                title,
                content,
                authorId: req.body.user.id
            }
        });
        if (!post) {
            return res.status(500).json({ msg: "Internal Server Error" });
        }
        res.json({ success: true, message: "Created Successfully" });
    }
    catch (er) {
        console.log(er);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
});
exports.handleCreatePost = handleCreatePost;
const handleGetPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query;
        let user = req.body.user;
        let page = (query.page && parseInt(query.page.toString()) > 1) ? parseInt(query.page.toString()) : 1;
        let posts = yield prisma.post.findMany({
            where: {
                authorId: user.id
            },
            skip: 10 * (page - 1),
            take: 10,
        });
        res.json({ success: true, data: posts });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
});
exports.handleGetPosts = handleGetPosts;
