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
    public async UpdateSpreadSheetData(spreadsheetId: string, d: string){
        // spreadsheet exists or not
        // if spreadsheet.collaborators include userId then only update
        // check if sheet exists or not in spreadsheet
        // update the sheet
        const data: StateData= JSON.parse(d)
        let spreadsheet = await this.dbclient.spreadsheet.findUnique({
            where:{
                id:Number.parseInt(data.SpreadSheetId)
            }

        })
        console.log(spreadsheet)



    }
}