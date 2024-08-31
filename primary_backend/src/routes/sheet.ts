
import express from "express"

import { handleCreateSpreadsheet, handleGetSpreadSheetCollaborators, handleGetSpreadsheets} from "../handlers/v1/spreadsheet"
import { AuthMiddleware } from "../middleware/authmiddleware"
import { GetSheetState } from "../handlers/v1/sheet"
const router = express.Router()
router.get("/state",AuthMiddleware, GetSheetState)
module.exports = router