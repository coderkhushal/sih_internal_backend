import { PrismaClient } from "@prisma/client";
import { StateData } from "../types";

export class DbManager {
    private static instance: DbManager;
    private dbclient: PrismaClient;
    private constructor() {
        this.dbclient = new PrismaClient()
        console.log("client created")
    }
    
    public static getInstance(): DbManager {
        if (!DbManager.instance) {
            DbManager.instance = new DbManager();
        }

        return DbManager.instance;
    }
    public getClient() {
        return this.dbclient
    }
    public async UpdateSpreadSheetData(SpreadSheetId: number, SheetId : number, userId:number , data: string){
        // spreadsheet exists or not
        // if spreadsheet.collaborators include userId then only update
        // check if sheet exists or not in spreadsheet
        // update the sheet
        console.log(SheetId, SpreadSheetId, userId, data)
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
    let ssheet = await this.dbclient.spreadsheet.findUnique({
        where:{
            id: SpreadSheetId
        }, 
        include:{
            collaborators: true, 
            sheets:true
        }
    })
    if(ssheet == null){
    
        return
    }
    if(ssheet.collaborators.filter((collab)=> collab.userId == userId).length == 0){
    
        return
    }
    let sheet = ssheet.sheets.filter((sheet)=> sheet.id == SheetId)
    if(sheet.length == 0){
    
        return
    }
    let updatedSheet = await this.dbclient.sheet.update({
        where:{
            id: SheetId
        },
        data:{
            state: {"data": "hello"}
        }

    })
    console.log(updatedSheet)


    }
}