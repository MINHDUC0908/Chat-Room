require("dotenv").config(); // Load biến môi trường từ file .env
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME, // Lấy tên database từ .env
    process.env.DB_USER, // Lấy username từ .env
    process.env.DB_PASS, // Lấy password từ .env
    {
        host: process.env.DB_HOST, // Lấy host từ .env
        dialect: process.env.DB_DIALECT, // Lấy loại database từ .env
        dialect: 'mysql',
        logging: false, // Tắt log SQL trong console
    }
);

sequelize
    .authenticate()
    .then(() => console.log("✅ Kết nối MySQL thành công"))
    .catch((err) => console.error("❌ Lỗi kết nối MySQL:", err));

module.exports = sequelize;
