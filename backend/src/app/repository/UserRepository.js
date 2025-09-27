const { User } = require("../model");

class UserRepository 
{
    async register(userData)
    {
        return await User.create(userData);
    }

    async findByEmail(email)
    {
        return await User.findOne({ where: { email } });
    }

    async findById(id)
    {
        return await User.findByPk(id, {
            attributes: { exclude: ['password'] } // không trả về password
        });
    }
}

module.exports = new UserRepository();