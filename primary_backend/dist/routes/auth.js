"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../handlers/v1/auth");
const router = express_1.default.Router();
router.post("/signup", auth_1.handlesignup);
router.post("/login", auth_1.handleLogin);
// router.post("/reset-password", handleResetPassword)
router.post("/reset-password/:token", auth_1.handleResetPasswordVerifyToken);
module.exports = router;
