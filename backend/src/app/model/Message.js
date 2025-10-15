const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const Group = require("./Group");

const Message = sequelize.define("Message", {
    id: {
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
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    video_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    video_public_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    video_name: {
        type: DataTypes.STRING(255),
        allowNull: true 
    },
    video_size: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    video_duration: {
        type: DataTypes.STRING(20),
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

module.exports = Message;