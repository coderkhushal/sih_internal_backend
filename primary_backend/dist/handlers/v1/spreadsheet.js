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
exports.handleGetSpreadSheetCollaborators = exports.handleGetSpreadsheets = exports.handleCreateSpreadsheet = void 0;
const DbManager_1 = require("../../utils/DbManager");
let prisma = DbManager_1.DbManager.getInstance().getClient();
const handleCreateSpreadsheet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { title } = req.body;
        if (!title) {
            // console.log(title, content)
            return res.status(400).json({ message: "All fields are required" });
        }
        let spreadsheet = yield prisma.spreadsheet.create({
            data: {
                title: title,
                ownerId: req.body.user.id,
                sheets: {
                    create: {
                        name: "Sheet1",
                        state: {}
                    }
                },
                collaborators: {
                    create: [
                        {
                            user: {
                                connect: {
                                    id: req.body.user.id
                                }
                            },
                            editPermissions: true
                        }
                    ]
                }
            },
        });
        if (!spreadsheet) {
            return res.status(500).json({ msg: "Internal Server Error" });
        }
        res.json({ success: true, message: "Created Successfully", SpreadSheetId: spreadsheet.id });
    }
    catch (er) {
        console.log(er);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
});
exports.handleCreateSpreadsheet = handleCreateSpreadsheet;
const handleGetSpreadsheets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query;
        let user = req.body.user;
        let page = (query.page && parseInt(query.page.toString()) > 1) ? parseInt(query.page.toString()) : 1;
        let spreadsheets = yield prisma.spreadsheet.findMany({
            where: {
                collaborators: {
                    some: {
                        userId: user.id
                    }
                }
            },
        });
        res.json({ success: true, data: spreadsheets });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
});
exports.handleGetSpreadsheets = handleGetSpreadsheets;
const handleGetSpreadSheetCollaborators = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let SpreadSheetId = req.query.SpreadSheetId;
        if (!SpreadSheetId) {
            return res.status(400).json({ message: "SpreadSheetId is required" });
        }
        let spreadsheet = yield prisma.spreadsheet.findUnique({
            where: {
                id: Number.parseInt(SpreadSheetId.toString())
            },
            include: {
                collaborators: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true,
                                id: true
                            }
                        }
                    }
                }
            }
        });
        res.json({ success: true, data: spreadsheet === null || spreadsheet === void 0 ? void 0 : spreadsheet.collaborators });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
});
exports.handleGetSpreadSheetCollaborators = handleGetSpreadSheetCollaborators;
