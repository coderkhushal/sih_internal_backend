import { Request, Response } from "express";
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client";
let prisma = new PrismaClient()
export const handleCreateSpreadsheet = async (req: Request, res: Response) => {
    try {

        let { title } = req.body
                if (!title ) {
                    // console.log(title, content)
            return res.status(400).json({ message: "All fields are required" })
        }


        let spreadsheet = await prisma.spreadsheet.create({
            data: {
                title: title,
                ownerId: req.body.user.id
            }
        });

        if (!spreadsheet) {
            return res.status(500).json({ msg: "Internal Server Error" });
        }
        res.json({ success: true, message: "Created Successfully" });
    }
    catch (er) {
        console.log(er)
        return res.status(500).json({ msg: "Internal Server Error" })
    }



}

export const handleGetSpreadsheets = async (req: Request, res: Response) => {
    try{

        const query = req.query
        let user = req.body.user
        let page = (query.page && parseInt(query.page.toString())>1) ? parseInt(query.page.toString()) : 1
        let spreadsheets = await prisma.spreadsheet.findMany({
            where: {
                ownerId: user.id
            },
            
            // skip: 10 * (page -1),
            // take : 10, 

        })
        res.json({success:true, data:spreadsheets})

    }
    catch(err){
        console.log(err)
        return res.status(500).json({msg:"Internal Server Error"})
    }
        
}