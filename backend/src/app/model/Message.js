const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Message = sequelize.define("Message", {
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: "messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});

module.exports = Message;
