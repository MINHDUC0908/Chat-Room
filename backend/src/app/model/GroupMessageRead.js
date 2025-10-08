const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const GroupMessage = require("./GroupMessage"); // mỗi bản ghi đọc gắn với tin nhắn nhóm

const GroupMessageRead = sequelize.define("GroupMessageRead", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    message_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: "group_messages",
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: "users",
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: "group_message_reads",  // ✅ đúng tên bảng
    timestamps: false
});

// ======================
// 🔗 Các mối quan hệ
// ======================
GroupMessageRead.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

GroupMessageRead.belongsTo(GroupMessage, {
    foreignKey: "message_id",
    as: "message",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

module.exports = GroupMessageRead;
