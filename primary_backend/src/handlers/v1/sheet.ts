import { Request, Response } from "express";
import { DbManager } from "../../utils/DbManager";

const prisma = DbManager.getInstance().getClient();

export const GetSheetState = async (req: Request, res: Response) => {
    try{
        
        const { SheetId } = req.query;
        if(!SheetId){
            return res.status(400).json({ error: "Sheet ID is required" });
        }

        const sheet = await prisma.sheet.findUnique({
            where: {
                id: parseInt(SheetId.toString()),
            },
        });
        if (!sheet) {
            return res.status(404).json({ error: "Sheet not found" });
        }
        return res.json({ state: sheet.state });
    }
    catch(err){
        console.log(err)
        return res.status(500).json({error: "Internal Server Error"})
    }
}