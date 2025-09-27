const express = require("express")
const router = express.Router()

const chat = require("../app/controller/ChatController")

router.get("/conversations", chat.getConversations)

module.exports = router
