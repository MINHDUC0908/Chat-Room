const express = require("express")
const router = express.Router()

const group = require("../app/controller/GroupController")
router.post("/create", group.createGroup)
router.get("/all", group.getgroupAll)
router.get("/members/:id", group.getGroup)
router.post("/createMes", group.createGroup)
router.get("/mesGr/:id", group.getAllMesGr)

module.exports = router