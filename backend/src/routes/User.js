const express = require("express")
const router = express.Router()

const users = require("../app/controller/UserController")

router.get("/", users.getAllUsers)

module.exports = router