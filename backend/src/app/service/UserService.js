const bcrypt = require('bcrypt');
const UserRepository = require('../repository/UserRepository');
const jwt = require('jsonwebtoken');
const { User } = require('../model');
const { Op } = require('sequelize');

class UserService
{
    async register(userData)
    {
        const { name, email, password } = userData;

        const existingUser = await UserRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email đã được sử dụng');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        return await UserRepository.register({
            name,
            email,
            password: hashedPassword
        });
    }

    async login(email, password)
    {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            return {
                message: 'Email không tồn tại',
            }
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                message: 'Mật khẩu không đúng',
            }
        }
        // Tạo token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name }, // payload
            process.env.JWT_SECRET,             // secret key
            { expiresIn: process.env.JWT_EXPIRES || '7d' } // thời hạn
        );

        return {
            message: "Đăng nhập thành công",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
            , token
        };
    }


    async getUser(id)
    {
        try {
            const user = await UserRepository.findById(id);
            if (user)
            {
                return {
                    data: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                }
            }
            return { message: "User not found" };
        } catch (error) {
            throw new Error("Lỗi khi lấy thông tin user");
        }
    }

    async getAllUsers(userId)
    {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                where: {
                    id: { [Op.ne]: userId } // loại bỏ user hiện tại
                }
            });

            return users;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách user");
        }
    }
}

module.exports = new UserService();