// utils/socketHandlers/groupHandler.js
const GroupService = require("../../app/service/GroupService");
const { User } = require("../../app/model");

function initGroupHandlers(io, socket) {
    // Tạo nhóm chat
    socket.on("create_group", async ({ name, members, creatorId }) => {
        try {
            const group = await GroupService.createGroup(name, members, creatorId);
            console.log("Group created:", creatorId);

            const allMembers = [creatorId, ...(members || [])];
            console.log("All group members:", allMembers);

            allMembers.forEach((userId) => {
                io.to(`user_${userId}`).socketsJoin(`group_${group.id}`);
            });

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
            console.log("✅ Message created:", msg.created_at);
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
                createdAt: msg.created_at,
                senderInfo
            });
            console.log("✅ Message emitted successfully", msg);
        } catch (err) {
            console.error("❌ Error sending group message:", err);
            socket.emit("error", { message: "Không thể gửi tin nhắn" });
        }
    });

    // Gửi ảnh trong nhóm
    socket.on("send_group_image", async ({ groupId, senderId, fileUrl, name }) => {
        try {
            const message = {
                name: name,
                senderId: senderId,
                groupId: groupId || null,
                imageUrl: fileUrl,
                createdAt: new Date(),
            };
            const sender = await User.findByPk(senderId);
            const senderInfo = sender ? {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                avatar: `https://i.pravatar.cc/50?u=${sender.id}`
            } : null;

            io.to(`group_${groupId}`).emit("send_group_image", message, senderInfo);
        } catch (err) {
            console.error("❌ Error sending group image:", err);
            socket.emit("error", { message: "Không thể gửi ảnh" });
        }
    });
}

module.exports = initGroupHandlers;