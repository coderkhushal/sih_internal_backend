"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const collaborator_1 = require("../handlers/v1/collaborator");
const router = express_1.default.Router();
router.post("/create", authmiddleware_1.AuthMiddleware, collaborator_1.handleCreateCollaborator);
module.exports = router;
