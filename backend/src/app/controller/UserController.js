const UserService = require("../service/UserService");

class UserController
{
    async getAllUsers(req, res)
    {
        try {
            const users = await UserService.getAllUsers(req.user.id);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
}

module.exports = new UserController();