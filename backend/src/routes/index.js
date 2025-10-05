const express = require("express")
const router = express.Router()

const authRoutes = require("./Auth")
const chatRoutes = require("./Chat")
const groupRoutes = require("./Group")
const userRoutes = require("./User")
const imageRoutes = require("./Image")
const authMiddleware = require("../app/middleware/authMiddleware")

function route(app)
{
    app.use("/auth", authRoutes)
    app.use("/profile", authMiddleware, (req, res) => {
        res.json({ message: "Đây là trang profile", user: req.user })
    })
    app.use("/users", authMiddleware, userRoutes)
    app.use("/chat", authMiddleware, chatRoutes)
    app.use("/group", authMiddleware, groupRoutes)
    app.use("/image", authMiddleware, imageRoutes)
}

module.exports = route