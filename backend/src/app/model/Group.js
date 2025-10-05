const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("./User");

const Group = sequelize.define("Group", {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    }
}, {
    tableName: "groups",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});

// Mối quan hệ: Một nhóm được tạo bởi một người dùng
Group.belongsTo(User, { foreignKey: "created_by", as: "creator" });

module.exports = Group;