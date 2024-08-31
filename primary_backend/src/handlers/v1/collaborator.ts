import { Request, Response } from "express";
import { DbManager } from "../../utils/DbManager";
const prisma = DbManager.getInstance().getClient()
export const handleCreateCollaborator = async (req: Request, res: Response) => {
    try{

        const {SpreadSheetID, email} = req.query
        if(!SpreadSheetID ){
        return res.status(400).json({
            message: "spreadsheetId is required"
        })
    }
    if(!email){
        return res.status(400).json({
            message: "email is required"
        })
    }
    let user = await prisma.user.findFirst({
        where:{
            email: email.toString()
        }
    })
    if(!user){
        return res.status(404).json({
            message: "User not found"
        })
    }
    await prisma.collaborator.create({
        data:{
            spreadsheetId: Number.parseInt(SpreadSheetID.toString()),
            editPermissions: true, 
            userId: user.id 
        }
        
    })
}
catch(err){
    console.log(err)
    return res.status(500).json({message: "Internal Server Error"})
}

    res.json({success:true, message: "Created Successfully"})
}