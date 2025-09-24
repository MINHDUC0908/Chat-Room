const express = require("express")
const router = express.Router()

const authRoutes = require("./Auth")
const authMiddleware = require("../app/middleware/authMiddleware")

function route(app)
{
    app.use("/auth", authRoutes)
    app.use("/profile", authMiddleware, (req, res) => {
        res.json({ message: "Đây là trang profile", user: req.user })
    })
}

module.exports = route