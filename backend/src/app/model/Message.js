const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Message = sequelize.define("Message", {
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: true // có thể là null nếu là tin nhắn nhóm
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: true // có thể là null nếu là tin nhắn cá nhân
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        type: DataTypes.TEXT,
        allowNull: true // cho phép null nếu chỉ gửi text
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

module.exports = Message;
