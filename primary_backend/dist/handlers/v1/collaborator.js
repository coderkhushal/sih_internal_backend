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
exports.handleCreateCollaborator = void 0;
const DbManager_1 = require("../../utils/DbManager");
const prisma = DbManager_1.DbManager.getInstance().getClient();
const handleCreateCollaborator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { SpreadSheetID, email } = req.query;
        if (!SpreadSheetID) {
            return res.status(400).json({
                message: "spreadsheetId is required"
            });
        }
        if (!email) {
            return res.status(400).json({
                message: "email is required"
            });
        }
        let user = yield prisma.user.findFirst({
            where: {
                email: email.toString()
            }
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        yield prisma.collaborator.create({
            data: {
                spreadsheetId: Number.parseInt(SpreadSheetID.toString()),
                editPermissions: true,
                userId: user.id
            }
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    res.json({ success: true, message: "Created Successfully" });
});
exports.handleCreateCollaborator = handleCreateCollaborator;
