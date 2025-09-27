// utils/socket.js
const { Server } = require("socket.io");
const ChatService = require("../app/service/ChatService");

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("🔗 New client connected: ", socket.id);

        // Tham gia room theo userId
        socket.on("join", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined room user_${userId}`);
        });

    // Nhận tin nhắn riêng
    socket.on("private_message", async ({ sender_id, receiver_id, content }) => {
        try {
            const msg = await ChatService.saveMessage(sender_id, receiver_id, content);

            // Gửi cho người nhận
            io.to(`user_${receiver_id}`).emit("private_message", msg);

            // Gửi lại cho người gửi để hiển thị
            io.to(`user_${sender_id}`).emit("private_message", msg);
        } catch (err) {
            console.error("❌ Error saving message:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected");
        });
    });

    return io;
}

module.exports = { initSocket, getIO: () => io };
