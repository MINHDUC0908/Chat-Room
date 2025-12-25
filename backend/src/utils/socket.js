// utils/socket.js
const { Server } = require("socket.io");
const { User } = require("../app/model");
const CallService = require("../app/service/CallService");
const initChatHandlers = require("./socketHandlers/chatHandler");
const initGroupHandlers = require("./socketHandlers/groupHandler");
const initGroupCallHandlers = require("./socketHandlers/groupCallHandler");

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

        // Nhắn tin riêng tư
        initChatHandlers(io, socket);

        // Nhóm chat
        initGroupHandlers(io, socket);

        // Nhóm gọi video/voice
        initGroupCallHandlers(socket, io);

        socket.on("call-user", async ({ senderId, receiverId, offer, type }) => {
            try {
                const call = await CallService.startCall(senderId, receiverId, type, "missed", 0);
                io.to(`user_${receiverId}`).emit("incoming-call", { 
                    from: senderId, 
                    offer, 
                    callId: call.id 
                });
            } catch (err) {
                console.error("❌ Lỗi khi lưu cuộc gọi:", err);
                socket.emit("call-error", { message: err.message });
            }
        });

        socket.on("answer-call", ({ senderId, receiverId, answer }) => {
            io.to(`user_${senderId}`).emit("call-answered", { 
                from: receiverId, 
                answer: answer 
            });
        });

        socket.on("ice-candidate", ({ senderId, receiverId, candidate }) => {
            io.to(`user_${receiverId}`).emit("ice-candidate", { 
                from: senderId,
                candidate: candidate 
            });
        });

        socket.on("end-call", ({ senderId, receiverId }) => {
            io.to(`user_${receiverId}`).emit("call-ended", { from: senderId });
            io.to(`user_${senderId}`).emit("call-ended", { from: receiverId });
        });

        socket.on("call-video-user", ({ senderId, receiverId, offer }) => {
            io.to(`user_${receiverId}`).emit("incoming-video-call", { 
                from: senderId, 
                offer: offer 
            });
        });

        socket.on("answer-video-call", ({ senderId, receiverId, answer }) => {
            io.to(`user_${senderId}`).emit("video-call-answered", { 
                from: receiverId, 
                answer: answer 
            });
        });

        socket.on("video-ice-candidate", ({ senderId, receiverId, candidate }) => {
            io.to(`user_${receiverId}`).emit("video-ice-candidate", { 
                from: senderId,
                candidate: candidate 
            });
        });

        socket.on("end-video-call", ({ senderId, receiverId }) => {
            io.to(`user_${receiverId}`).emit("video-call-ended", { from: senderId });
            io.to(`user_${senderId}`).emit("video-call-ended", { from: receiverId });
        });

        socket.on("disconnect", async () => {
            if (socket.userId) {
                const now = new Date();
                await User.update(
                    { is_online: false, last_active: now },
                    { where: { id: socket.userId } }
                );
                io.emit("user_status_change", {
                    userId: socket.userId,
                    isOnline: false,
                    lastActive: now,
                });
                console.log("❌ User disconnected:", socket.userId);
            }
        });
    });
    
    return io;
}

module.exports = { initSocket, getIO: () => io };