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
    public async UpdateSpreadSheetData(SpreadSheetId: number, sheedId : number, userId:number , data: string){
        // spreadsheet exists or not
        // if spreadsheet.collaborators include userId then only update
        // check if sheet exists or not in spreadsheet
        // update the sheet
       let updatedSheet = await  this.dbclient.sheet.updateMany({
        where:{
            id: sheedId, 
            spreadsheetId: SpreadSheetId,
            spreadsheet: {
                collaborators:{
                    some:{
                        userId: userId
                    }
                }
            },

        },

            data:{
                state: data
            }
       })
       if(updatedSheet.count == 0){
            console.log("sheet not found")
       }


    }
}