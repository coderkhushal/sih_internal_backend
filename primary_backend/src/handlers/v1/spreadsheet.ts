import { Request, Response } from "express";

import { DbManager } from "../../utils/DbManager";
let prisma = DbManager.getInstance().getClient()
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
                ownerId: req.body.user.id,
                sheets:{
                    create:{
                        name: "Sheet1", 
                        state : {}
                    }
                }, 
                collaborators  : {
                    create: [
                        {

                         user:{
                                connect:{
                                    id:req.body.user.id
                                }
                         } ,
                         editPermissions: true
                            
                        }

                    ]
                }
            }, 
            
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
export const handleGetSpreadSheetCollaborators = async (req: Request, res: Response) => {
    try{

        let SpreadSheetId = req.query.SpreadSheetId
        
        if(!SpreadSheetId){
            return res.status(400).json({message:"SpreadSheetId is required"})
        }
        
        let spreadsheet = await prisma.spreadsheet.findUnique({
            where: {
                id: Number.parseInt(SpreadSheetId.toString())
            },
            include:{
                collaborators:{
                    include:{
                        user:{
                            select:{
                                email: true, 
                                name: true, 
                                id: true
                            }
                        }
                    }
                }
            }
        })
        res.json({success:true, data:spreadsheet?.collaborators})

    }
    catch(err){
        console.log(err)
        return res.status(500).json({msg:"Internal Server Error"})
    }
        
}