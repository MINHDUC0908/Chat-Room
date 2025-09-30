const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");
const Group = require("./Group");

const GroupMember = sequelize.define("GroupMember", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED, // Thay đổi để đồng bộ với User và Group
        primaryKey: true,
        autoIncrement: true
    },
    group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
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

// Mối quan hệ: GroupMember thuộc về một User và một Group
GroupMember.belongsTo(User, { foreignKey: "user_id", as: "user" });
GroupMember.belongsTo(Group, { foreignKey: "group_id", as: "group", onDelete: "CASCADE", onUpdate: "CASCADE" });

module.exports = GroupMember;