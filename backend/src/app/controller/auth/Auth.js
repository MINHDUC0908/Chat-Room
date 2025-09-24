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
}

module.exports = new Auth();