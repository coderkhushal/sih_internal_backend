import express from "express"

import { handleCreateSpreadsheet, handleGetSpreadSheetCollaborators, handleGetSpreadsheets} from "../handlers/v1/spreadsheet"
import { AuthMiddleware } from "../middleware/authmiddleware"
const router = express.Router()

router.post("/create", AuthMiddleware,  handleCreateSpreadsheet)
// handle query on get request
router.get("/",AuthMiddleware, handleGetSpreadsheets)
router.get("/collaborators", AuthMiddleware, handleGetSpreadSheetCollaborators)
// router.get("/sheets", AuthMiddleware, handleGetSpreadsheetSheets)



module.exports = router