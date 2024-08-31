"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const spreadsheet_1 = require("../handlers/v1/spreadsheet");
const authmiddleware_1 = require("../middleware/authmiddleware");
const router = express_1.default.Router();
router.post("/create", authmiddleware_1.AuthMiddleware, spreadsheet_1.handleCreateSpreadsheet);
// handle query on get request
router.get("/", authmiddleware_1.AuthMiddleware, spreadsheet_1.handleGetSpreadsheets);
router.get("/collaborators", authmiddleware_1.AuthMiddleware, spreadsheet_1.handleGetSpreadSheetCollaborators);
// router.get("/sheets", AuthMiddleware, handleGetSpreadsheetSheets)
module.exports = router;
