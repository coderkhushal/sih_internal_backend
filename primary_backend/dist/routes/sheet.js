"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const sheet_1 = require("../handlers/v1/sheet");
const router = express_1.default.Router();
router.get("/state", authmiddleware_1.AuthMiddleware, sheet_1.GetSheetState);
module.exports = router;
