const express = require("express")
const router = express.Router()

const authRoutes = require("./Auth")
const chatRoutes = require("./Chat")
const authMiddleware = require("../app/middleware/authMiddleware")

function route(app)
{
    app.use("/auth", authRoutes)
    app.use("/profile", authMiddleware, (req, res) => {
        res.json({ message: "Đây là trang profile", user: req.user })
    })
    app.use("/chat", authMiddleware, chatRoutes)
}

module.exports = route