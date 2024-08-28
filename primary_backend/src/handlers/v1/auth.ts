import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
import crypto from "crypto"
// import { Mailer } from "../../service/mailer";
let prisma = new PrismaClient()

 
export const handlesignup = async (req: Request, res : Response)=>{
        let {name, email, password} = req.body
        if(!name || !email || !password){
            return res.status(400).json({message: "All fields are required"})
        }
        
        try{
            let salt = bcrypt.genSaltSync(10);
            password= await bcrypt.hash(password, salt )
            let user= await prisma.user.create({
                data:{
                    name,
                    email,
                    password
                }
            })
            let token = jwt.sign({id: user.id}, process.env.JWT_SECRET as string, {expiresIn: "1d"})
         
            res.cookie("token", token)
            
            res.json({success:true, message:"Created Successfully", token:token})
        }
        catch(er){
            console.log(er)
            return res.status(500).json({message: "Internal Server Error"})
        }
        
        
        
    }


export const handleLogin = async (req: Request, res: Response) => {
    let { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }
    try {
        let user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }
        let isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }
        let token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "1d" })
        res.cookie("token", token)
        res.json({ success: true, message: "Logged In Successfully", token : token })
    }
    catch (er) {
        console.log(er)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// export const handleResetPassword = async (req: Request, res: Response) => {
//     try{
//         const {email} = req.body
//         if(!email){
//             return res.status(400).json({message: "Email is required"})
//         }
//         const user = await prisma.user.findUnique({
//             where:{
//                 email
//             }
//         })
//         if(!user){
//             return res.status(400).json({message: "User not found"})
//         }
//         const resetPasswordToken = crypto.randomBytes(20).toString("hex")
//         await prisma.user.update({
//             where:{
//                 id: user.id
//             },
//             data:{
//                 resetPasswordToken,
//                 resetPasswordTokenExpiry: new Date()  // Convert Date.now() to a Date object
                
//             }
//         })
        
//         let response = await Mailer.getinstance().sendMail(email, resetPasswordToken)
//         if(response){

//             return res.status(200).json({message: "Email sent"})
//         }
//         else{
//             return res.status(500).json({message: "Internal Server Error"})
//         }
    

//     }
//     catch(err)
//     {
//         console.log(err)
//         return res.status(500).json({message: "Internal Server Error"})
//     }
// }
export const handleResetPasswordVerifyToken = async (req: Request, res: Response) => {
    try{
        const {token} = req.params
        if(!token){
            return res.status(400).json({message: "Token is required"})
        }
        const user = await prisma.user.findFirst({
            where:{
                resetPasswordToken: token,

            }
        })
        if(!user || !user.resetPasswordTokenExpiry ){
            return res.status(400).json({message: "Invalid Token"})
        }
        if(user.resetPasswordTokenExpiry && ( new Date(user.resetPasswordTokenExpiry).getTime()  - new Date().getTime()  )/60000 > 10  ){
            return res.status(400).json({message: "Token expired"})
        }
        let {password} = req.body
        if(!password){
            return res.status(400).json({message: "Password is required"})
        }
        let salt = bcrypt.genSaltSync(10);
        password= await bcrypt.hash(password, salt )
        let updatedUser = await prisma.user.update({
            where:{
                id: user.id
            },
            data:{
                password,
                resetPasswordToken: null,
                resetPasswordTokenExpiry : null
            }
        })
        res.json({success:true, message:"Password updated successfully"})
    }
    catch(err){
        console.log(err)
        return res.status(500).json({message: "Internal Server Error"})
    }
}