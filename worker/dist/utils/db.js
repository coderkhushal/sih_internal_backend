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
exports.DbManager = void 0;
const client_1 = require("@prisma/client");
class DbManager {
    constructor() {
        this.dbclient = new client_1.PrismaClient();
        console.log("client created");
    }
    static getInstance() {
        if (!DbManager.instance) {
            DbManager.instance = new DbManager();
        }
        return DbManager.instance;
    }
    getClient() {
        return this.dbclient;
    }
    UpdateSpreadSheetData(SpreadSheetId, SheetId, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // spreadsheet exists or not
            // if spreadsheet.collaborators include userId then only update
            // check if sheet exists or not in spreadsheet
            // update the sheet
            console.log(SheetId, SpreadSheetId, userId, data);
            //    let updatedSheet = await  this.dbclient.sheet.updateMany({
            //     where:{
            //         id: SheetId, 
            //         spreadsheetId: SpreadSheetId,
            //         spreadsheet: {
            //             collaborators:{
            //                 some:{
            //                     userId: userId
            //                 }
            //             }
            //         },
            //     },
            //         data:{
            //             state: data
            //         }
            //    })
            let ssheet = yield this.dbclient.spreadsheet.findUnique({
                where: {
                    id: SpreadSheetId
                },
                include: {
                    collaborators: true,
                    sheets: true
                }
            });
            if (ssheet == null) {
                return;
            }
            if (ssheet.collaborators.filter((collab) => collab.userId == userId).length == 0) {
                return;
            }
            let sheet = ssheet.sheets.filter((sheet) => sheet.id == SheetId);
            if (sheet.length == 0) {
                return;
            }
            let updatedSheet = yield this.dbclient.sheet.update({
                where: {
                    id: SheetId
                },
                data: {
                    state: { "data": data }
                }
            });
            console.log(updatedSheet);
        });
    }
}
exports.DbManager = DbManager;
