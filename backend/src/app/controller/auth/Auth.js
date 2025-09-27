const { User } = require('../../model');
const UserService = require('../../service/UserService');

class Auth
{
    async register(req, res)
    {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ message: "Thiếu dữ liệu" });
            }
            const user = await UserService.register({ name, email, password });
            res.status(201).json({ 
                message: 'Đăng ký thành công', user 
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }


    async login(req, res)
    {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Thiếu dữ liệu" });
            }
            const result = await UserService.login(email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }


    async users(req, res)
    {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] } // không trả về password
            });
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server" });
        }
    }


    async getUser(req, res)
    {
        try {
            const id = req.params.id;
            const result = await UserService.getUser(id);
            if (result.data) {
                res.status(200).json(result.data);
            } else {
                res.status(404).json({ message: result.message });
            }
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
}

module.exports = new Auth();