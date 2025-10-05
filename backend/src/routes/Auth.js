const express = require("express")
const router = express.Router()

const auth = require("../app/controller/auth/Auth")

router.post("/register", auth.register)
router.post("/login", auth.login)
router.get("/users", auth.users)
router.get("/user/:id", auth.getUser)

module.exports = router
