import express from "express"

import { handleLogin, handleResetPasswordVerifyToken, handlesignup } from "../handlers/v1/auth"
const router = express.Router()

router.post("/signup", handlesignup)
router.post("/login", handleLogin)
// router.post("/reset-password", handleResetPassword)
router.post("/reset-password/:token", handleResetPasswordVerifyToken)


module.exports = router