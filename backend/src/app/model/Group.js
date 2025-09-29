const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Group = sequelize.define("Group", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "groups",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});

module.exports = Group;
