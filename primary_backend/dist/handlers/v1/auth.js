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
exports.handleResetPasswordVerifyToken = exports.handleLogin = exports.handlesignup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
// import { Mailer } from "../../service/mailer";
let prisma = new client_1.PrismaClient();
const handlesignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        let salt = bcryptjs_1.default.genSaltSync(10);
        password = yield bcryptjs_1.default.hash(password, salt);
        let user = yield prisma.user.create({
            data: {
                name,
                email,
                password
            }
        });
        let token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token);
        res.json({ success: true, message: "Created Successfully", token: token });
    }
    catch (er) {
        console.log(er);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.handlesignup = handlesignup;
const handleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        let user = yield prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        let isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        let token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token);
        res.json({ success: true, message: "Logged In Successfully", token: token });
    }
    catch (er) {
        console.log(er);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.handleLogin = handleLogin;
// export const handleResetPassword = async (req: Request, res: Response) => {
//     try{
//         const {email} = req.body
//         if(!email){
//             return res.status(400).json({message: "Email is required"})
//         }
//         const user = await prisma.user.findUnique({
//             where:{
//                 email
//             }
//         })
//         if(!user){
//             return res.status(400).json({message: "User not found"})
//         }
//         const resetPasswordToken = crypto.randomBytes(20).toString("hex")
//         await prisma.user.update({
//             where:{
//                 id: user.id
//             },
//             data:{
//                 resetPasswordToken,
//                 resetPasswordTokenExpiry: new Date()  // Convert Date.now() to a Date object
//             }
//         })
//         let response = await Mailer.getinstance().sendMail(email, resetPasswordToken)
//         if(response){
//             return res.status(200).json({message: "Email sent"})
//         }
//         else{
//             return res.status(500).json({message: "Internal Server Error"})
//         }
//     }
//     catch(err)
//     {
//         console.log(err)
//         return res.status(500).json({message: "Internal Server Error"})
//     }
// }
const handleResetPasswordVerifyToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const user = yield prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
            }
        });
        if (!user || !user.resetPasswordTokenExpiry) {
            return res.status(400).json({ message: "Invalid Token" });
        }
        if (user.resetPasswordTokenExpiry && (new Date(user.resetPasswordTokenExpiry).getTime() - new Date().getTime()) / 60000 > 10) {
            return res.status(400).json({ message: "Token expired" });
        }
        let { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
        let salt = bcryptjs_1.default.genSaltSync(10);
        password = yield bcryptjs_1.default.hash(password, salt);
        let updatedUser = yield prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password,
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null
            }
        });
        res.json({ success: true, message: "Password updated successfully" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.handleResetPasswordVerifyToken = handleResetPasswordVerifyToken;
