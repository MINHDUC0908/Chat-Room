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
}

module.exports = new UserRepository();