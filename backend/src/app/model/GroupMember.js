const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const GroupMember = sequelize.define("GroupMember", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "member" // member, admin
    }
}, {
    tableName: "group_members",
    timestamps: true,
    createdAt: "joined_at",
    updatedAt: false
});

module.exports = GroupMember;
