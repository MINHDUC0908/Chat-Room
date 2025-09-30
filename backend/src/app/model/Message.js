const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const Group = require("./Group");

const Message = sequelize.define("Message", {
    id: { // Thêm cột id làm khóa chính
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true // Có thể là null nếu là tin nhắn nhóm
    },
    group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true // Có thể là null nếu là tin nhắn cá nhân
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: "messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});

// Mối quan hệ
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });
Message.belongsTo(Group, { foreignKey: "group_id", as: "group" });

module.exports = Message;