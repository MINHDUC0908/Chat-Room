// utils/socket.js
const { Server } = require("socket.io");
const ChatService = require("../app/service/ChatService");
const GroupService = require("../app/service/GroupService");
const { User, Message } = require("../app/model");

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

                // ✅ Lấy thông tin người gửi
                const sender = await User.findByPk(sender_id);
                const senderInfo = sender ? {
                    id: sender.id,
                    name: sender.name,
                    email: sender.email,
                    avatar: `https://i.pravatar.cc/50?u=${sender.id}`
                } : null;

                // ✅ Gửi kèm senderInfo cho người nhận (để hiện toast)
                io.to(`user_${receiver_id}`).emit("private_message", msg, senderInfo);

                // ✅ Gửi cho người gửi (không cần senderInfo vì là tin nhắn của chính họ)
                io.to(`user_${sender_id}`).emit("private_message", msg, null);
            } catch (err) {
                console.error("❌ Error saving message:", err);
            }
        });
        // Gửi ảnh trong chat (Dùng sau khi upload thành công)
        socket.on("send_image_message", async ({ senderId, receiverId, groupId, fileUrl }) => {
            try {
                // Tạo message trong DB
                const message = {
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

                // Gửi socket cho người nhận hoặc group
                if (receiverId) {
                    io.to(`user_${receiverId}`).emit("send_image_message", message, senderInfo);
                    io.to(`user_${senderId}`).emit("send_image_message", message);
                } 
            } catch (err) {
                console.error("❌ Error sending image message:", err);
                socket.emit("error", { message: "Không thể gửi ảnh" });
            }
        });


        // Đánh dấu tin nhắn là đã đọc
        socket.on("mark_as_read", async ({ userId, senderId }) => {
            try {
                await ChatService.markAsRead(userId, senderId);
                console.log(`Messages from ${senderId} to ${userId} marked as read.`);

                // Gửi cho người gửi biết rằng receiver đã đọc
                io.to(`user_${senderId}`).emit("messages_read", {
                    readerId: userId,
                    senderId
                });
            } catch (err) {
                console.error("❌ Error marking messages as read:", err);
            }
        });

        // Tạo nhóm chat
        socket.on("create_group", async ({ name, members, creatorId }) => {
            try {
                // 1. Gọi service để tạo group + lưu DB
                const group = await GroupService.createGroup(name, members, creatorId);
                console.log("Group created:", creatorId);

                // 2. Lấy danh sách member (bao gồm creator)
                const allMembers = [creatorId, ...(members || [])];
                console.log("All group members:", allMembers);

                // 3. Cho socket của tất cả user join vào room group đó
                allMembers.forEach((userId) => {
                    io.to(`user_${userId}`).socketsJoin(`group_${group.id}`);
                });

                // 4. Phát sự kiện "group_created" cho tất cả thành viên
                io.to(`group_${group.id}`).emit("group_created", {
                    id: group.id,
                    name: group.name,
                    avatar: "https://i.pravatar.cc/50?u=" + group.id,
                    lastMessage: "",
                    lastTime: new Date().toISOString(),
                    members: allMembers,
                    unreadCount: 0,
                    isGroup: true,
                });
                console.log(`🎉 Group ${group.name} (${group.id}) created by ${creatorId}`);
            } catch (err) {
                console.error("❌ Error creating group:", err);
                socket.emit("error", { message: "Không thể tạo nhóm" });
            }
        });


        socket.on("join_group", ({ groupId }) => {
            socket.join(`group_${groupId}`);
            console.log(`👤 User ${socket.id} joined group room: group_${groupId}`);
        });

        // Nhắn tin nhóm 
        socket.on("send_group_message", async ({ groupId, senderId, content }) => {
            console.log("🔵 Server received send_group_message:", { groupId, senderId, content });
            try {
                const msg = await GroupService.createMessageGroup(groupId, senderId, content);
                const sender = await User.findByPk(senderId);
            
                const senderInfo = sender ? {
                    id: sender.id,
                    name: sender.name,
                    email: sender.email,
                    avatar: `https://i.pravatar.cc/50?u=${sender.id}`
                } : null;
                
                io.to(`group_${groupId}`).emit("group_message", {
                    id: msg.id,
                    senderId: parseInt(senderId),
                    groupId: parseInt(groupId),
                    content: msg.content,
                    createdAt: msg.createdAt,
                    senderInfo
                });
                console.log("✅ Message emitted successfully", msg);
            } catch (err) {
                console.error("❌ Error sending group message:", err);
                socket.emit("error", { message: "Không thể gửi tin nhắn" });
            }
        });

        // Gửi ảnh trong nhóm (Dùng sau khi upload thành công)
        socket.on("send_group_image", async ({ groupId, senderId, fileUrl }) => {
            try {
                // Tạo message trong DB 
                const message = {
                    senderId: senderId,
                    groupId: groupId || null,
                    imageUrl: fileUrl,
                    createdAt: new Date(),
                }
                const sender = await User.findByPk(senderId);
                const senderInfo = sender ? {
                    id: sender.id,
                    name: sender.name,
                    email: sender.email,
                    avatar: `https://i.pravatar.cc/50?u=${sender.id}`
                } : null;
                // Gửi socket cho group
                io.to(`group_${groupId}`).emit("send_group_image", message, senderInfo);
            } catch (err) {
                console.error("❌ Error sending group image:", err);
                socket.emit("error", { message: "Không thể gửi ảnh" });
            }
        });

        socket.on("user_online", async (userId) => {
            socket.userId = userId;

            await User.update({ is_online: true }, { where: { id: userId } });
            io.emit("user_status_change", { userId, isOnline: true });
        });
        socket.on("user_offline", async (userId) => {
            console.log("❌ User logout:", userId);
            await User.update({ is_online: false }, { where: { id: userId } });
            io.emit("user_status_change", { userId, isOnline: false });
        });

        socket.on("disconnect", async () => {
            if (socket.userId) {
                await User.update({ is_online: false }, { where: { id: socket.userId } });
                io.emit("user_status_change", { userId: socket.userId, isOnline: false });
                console.log("❌ User disconnected:", socket.id);
            }
        });
    });
    return io;
}

module.exports = { initSocket, getIO: () => io };
