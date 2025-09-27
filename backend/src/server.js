const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const sequelize = require("./config/db"); // Kết nối MySQL
const { syncDatabase } = require("./app/model");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
// ✅ Middleware parse body phải đặt TRƯỚC routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Kết nối Database
sequelize.sync({ force: false }) // force: false để tránh mất dữ liệu
    .then(() => console.log("✅ Bảng đã được đồng bộ với MySQL"))
    .catch((err) => console.error("❌ Lỗi đồng bộ:", err));

syncDatabase(); // Chạy hàm đồng bộ database nếu cần

server.listen(3000, "0.0.0.0", () => {
    console.log(`Server is running on port ${3000}`);
});

const routes = require("./routes");
routes(app); // Sử dụng routes

// Khởi tạo socket
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép tất cả, hoặc cụ thể: ["http://192.168.1.101:5173", "http://192.168.1.102:5173"]
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Nhận tin nhắn từ client
    socket.on("chatMessage", (msg) => {
        console.log("📩 Message:", msg);

        // Gửi lại cho tất cả client
        io.emit("chatMessage", msg);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});
