import express from "express"

import { handleCreateSpreadsheet, handleGetSpreadsheets} from "../handlers/v1/spreadsheet"
import { AuthMiddleware } from "../middleware/authmiddleware"
const router = express.Router()

router.post("/create", AuthMiddleware,  handleCreateSpreadsheet)
// handle query on get request
router.get("/",AuthMiddleware, handleGetSpreadsheets)


module.exports = router