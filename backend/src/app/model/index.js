const sequelize = require("../../config/db");
const Group = require("./Group");
const GroupMember = require("./GroupMember");
const GroupMessage = require("./GroupMessage");
const Message = require("./Message");
const User = require("./User");

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Kết nối database thành công!");
        
        await sequelize.sync({ alter: true }); // Đồng bộ Model với DB
        console.log("✅ Database đã được đồng bộ!");
    } catch (error) {
        console.error("❌ Lỗi kết nối database:", error);
    }
};

module.exports = { syncDatabase, User, Group, GroupMember, Message, GroupMessage};