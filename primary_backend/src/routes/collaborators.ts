
import express from "express"

import { AuthMiddleware } from "../middleware/authmiddleware"
import { handleCreateCollaborator } from "../handlers/v1/collaborator"
const router = express.Router()

router.post("/create", AuthMiddleware, handleCreateCollaborator )
module.exports= router