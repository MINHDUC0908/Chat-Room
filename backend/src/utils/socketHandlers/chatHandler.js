
// utils/socketHandlers/chatHandler.js
const ChatService = require("../../app/service/ChatService");
const { User } = require("../../app/model");

function initChatHandlers(io, socket) {
    // Tham gia room theo userId
    socket.on("join", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    });

    // Nhận tin nhắn riêng
    socket.on("private_message", async ({ sender_id, receiver_id, content }) => {
        try {
            const msg = await ChatService.saveMessage(sender_id, receiver_id, content);
            const sender = await User.findByPk(sender_id);
            const senderInfo = sender ? {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                avatar: `https://i.pravatar.cc/50?u=${sender.id}`
            } : null;

            io.to(`user_${receiver_id}`).emit("private_message", msg, senderInfo);
            io.to(`user_${sender_id}`).emit("private_message", msg, null);
        } catch (err) {
            console.error("❌ Error saving message:", err);
        }
    });

    // Xóa tin nhắn
    socket.on("delete_message", async ({ messageId, userId, receiverId }) => {
        try {
            const message = await ChatService.deleteMessage(messageId);
            if (message) {
                io.to(`user_${userId}`).emit("delete_message", { messageId });
                io.to(`user_${receiverId}`).emit("delete_message", { messageId });
            }
        } catch (error) {
            console.error("❌ Error deleting message:", error);
        }
    });

    // Gửi ảnh
    socket.on("send_image_message", async ({ id, senderId, receiverId, groupId, fileUrl }) => {
        try {
            const message = {
                id: id,
                senderId: senderId,
                receiverId: receiverId || null,
                groupId: groupId || null,
                imageUrl: fileUrl,
                createdAt: new Date(),
                isRead: false
            };

            const sender = await User.findByPk(senderId);
            const senderInfo = sender ? {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                avatar: `https://i.pravatar.cc/50?u=${sender.id}`
            } : null;

            if (receiverId) {
                io.to(`user_${receiverId}`).emit("send_image_message", message, senderInfo);
                io.to(`user_${senderId}`).emit("send_image_message", message);
            }
        } catch (err) {
            console.error("❌ Error sending image message:", err);
            socket.emit("error", { message: "Không thể gửi ảnh" });
        }
    });

    // Gửi video
    socket.on("send_video_message", async ({ id, senderId, receiverId, fileUrl, videoName, videoSize, duration }) => {
        try {
            const message = {
                id: id,
                senderId: senderId,
                receiverId: receiverId || null,
                videoUrl: fileUrl,
                createdAt: new Date(),
                videoName: videoName,
                videoSize: videoSize,
                duration: duration,
                isRead: false
            };

            const sender = await User.findByPk(senderId);
            const senderInfo = sender ? {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                avatar: `https://i.pravatar.cc/50?u=${sender.id}`
            } : null;

            if (receiverId) {
                io.to(`user_${receiverId}`).emit("send_video_message", message, senderInfo);
                io.to(`user_${senderId}`).emit("send_video_message", message);
            }
        } catch (error) {
            console.error("❌ Error sending video message:", error);
            socket.emit("error", { message: "Không thể gửi video" });
        }
    });

    // Đánh dấu đã đọc
    socket.on("mark_as_read", async ({ userId, senderId }) => {
        try {
            await ChatService.markAsRead(userId, senderId);
            console.log(`Messages from ${senderId} to ${userId} marked as read.`);

            io.to(`user_${senderId}`).emit("messages_read", {
                readerId: userId,
                senderId
            });
        } catch (err) {
            console.error("❌ Error marking messages as read:", err);
        }
    });

    // Online/Offline status
    socket.on("user_online", async (userId) => {
        socket.userId = userId;
        await User.update({ is_online: true }, { where: { id: userId } });
        io.emit("user_status_change", { userId, isOnline: true });
    });

    socket.on("user_offline", async (userId) => {
        console.log("❌ User logout:", userId);
        await User.update(
            { is_online: false, last_active: new Date() },
            { where: { id: userId } }
        );
        io.emit("user_status_change", { userId, isOnline: false, lastActive: new Date() });
    });
}

module.exports = initChatHandlers;