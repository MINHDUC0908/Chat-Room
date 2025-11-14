const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const Message = require("./Message"); // import Message để liên kết

const Call = sequelize.define("Call", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    caller_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    receiver_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM("voice", "video"),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("missed", "answered", "rejected", "ended"),
        defaultValue: "missed",
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER, // lưu số giây
        allowNull: true,
    },
    message_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
            model: Message,      // liên kết tới bảng messages
            key: "id"
        },
        onDelete: "CASCADE",   // nếu message bị xóa, trường này = NULL
        onUpdate: "CASCADE"
    }
}, {
    tableName: "calls",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
});

// Quan hệ với bảng users
Call.belongsTo(User, { as: "caller", foreignKey: "caller_id" });
Call.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

// Quan hệ với bảng messages
Call.belongsTo(Message, { as: "message", foreignKey: "message_id" });
Message.hasOne(Call, { as: "call", foreignKey: "message_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

module.exports = Call;
