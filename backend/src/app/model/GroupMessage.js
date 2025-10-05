const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const Group = require("./Group");

const GroupMessage = sequelize.define("GroupMessage", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: "group_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});

// Mối quan hệ
GroupMessage.belongsTo(Group, { foreignKey: "group_id", as: "group" });
GroupMessage.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

module.exports = GroupMessage;