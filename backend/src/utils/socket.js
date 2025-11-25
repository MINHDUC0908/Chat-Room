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

        // 📞 Nhận tín hiệu gọi
        socket.on("call-user", async ({ senderId, receiverId, offer, type }) => {
            try {
                // Nếu type không truyền, mặc định 'voice'
                const call = await CallService.startCall(senderId, receiverId, type, "missed", 0);
                console.log("✅ Call saved:", call.id);

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

        // ✅ Gửi lại answer
        socket.on("answer-call", ({ senderId, receiverId, answer }) => {
            console.log(`✅ User ${receiverId} answered call from ${senderId}`);
            // Gửi answer về cho người gọi
            io.to(`user_${senderId}`).emit("call-answered", { 
                from: receiverId, 
                answer: answer 
            });
        });

        // 🧊 Gửi ICE candidate
        socket.on("ice-candidate", ({ senderId, receiverId, candidate }) => {
            console.log(`🧊 ICE candidate from ${senderId} to ${receiverId}`);
            // Gửi ICE candidate cho đối phương
            io.to(`user_${receiverId}`).emit("ice-candidate", { 
                from: senderId,
                candidate: candidate 
            });
        });

        // 📴 Ngắt cuộc gọi
        socket.on("end-call", ({ senderId, receiverId }) => {
            console.log(`📴 Call ended between ${senderId} and ${receiverId}`);
            io.to(`user_${receiverId}`).emit("call-ended", { from: senderId });
            io.to(`user_${senderId}`).emit("call-ended", { from: receiverId });
        });



        // 📞 Nhận tín hiệu gọi VIDEO
        socket.on("call-video-user", ({ senderId, receiverId, offer }) => {
            console.log(`📹 VIDEO Call from user ${senderId} to user ${receiverId}`);
            io.to(`user_${receiverId}`).emit("incoming-video-call", { 
                from: senderId, 
                offer: offer 
            });
        });

        // ✅ Gửi lại answer VIDEO
        socket.on("answer-video-call", ({ senderId, receiverId, answer }) => {
            console.log(`✅ User ${receiverId} answered VIDEO call from ${senderId}`);
            io.to(`user_${senderId}`).emit("video-call-answered", { 
                from: receiverId, 
                answer: answer 
            });
        });

        // 🧊 Gửi ICE candidate VIDEO
        socket.on("video-ice-candidate", ({ senderId, receiverId, candidate }) => {
            console.log(`🧊 VIDEO ICE candidate from ${senderId} to ${receiverId}`);
            io.to(`user_${receiverId}`).emit("video-ice-candidate", { 
                from: senderId,
                candidate: candidate 
            });
        });

        // 📴 Ngắt cuộc gọi VIDEO
        socket.on("end-video-call", ({ senderId, receiverId }) => {
            console.log(`📴 VIDEO Call ended between ${senderId} and ${receiverId}`);
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
