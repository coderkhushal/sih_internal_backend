import express from "express"

import { handleLogin, handleResetPasswordVerifyToken, handlesignup, handleGetUser } from "../handlers/v1/auth"
import { AuthMiddleware } from "../middleware/authmiddleware"
const router = express.Router()

router.post("/signup", handlesignup)
router.post("/login", handleLogin)
router.get("/user", AuthMiddleware , handleGetUser)
// router.post("/reset-password", handleResetPassword)
router.post("/reset-password/:token", handleResetPasswordVerifyToken)


module.exports = router