const express = require('express');
const http = require('http');
const path = require('path')
const cors = require('cors');
const sequelize = require("./config/db"); // Kết nối MySQL
const { syncDatabase } = require("./app/model");
require('dotenv').config();
const { initSocket } = require('./utils/socket');

const app = express();
const server = http.createServer(app);

app.use(cors());
// ✅ Middleware parse body phải đặt TRƯỚC routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static("public")); 
app.use("/image/message", express.static(path.join(__dirname, "public/image/message")));
// 4️⃣ Kết nối Database
sequelize.sync({ force: false }) // force: false để tránh mất dữ liệu
    .then(() => console.log("✅ Bảng đã được đồng bộ với MySQL"))
    .catch((err) => console.error("❌ Lỗi đồng bộ:", err));

syncDatabase(); // Chạy hàm đồng bộ database nếu cần
initSocket(server);

server.listen(3000, "0.0.0.0", () => {
    console.log(`Server is running on port ${3000}`);
});

const routes = require("./routes");
routes(app); // Sử dụng routes
