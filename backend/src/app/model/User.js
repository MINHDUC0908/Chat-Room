const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true // cho phép để trống
    }
}, {
    timestamps: true, // thêm createdAt, updatedAt
    tableName: "users" // đặt tên bảng rõ ràng
});

module.exports = User;
