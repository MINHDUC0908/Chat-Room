// utils/socket.js
const { Server } = require("socket.io");
const ChatService = require("../app/service/ChatService");
const GroupService = require("../app/service/GroupService");
const ImageService = require("../app/service/ImageService");

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

        // Gửi ảnh trong chat (Dùng sau khi upload thành công)
        socket.on("send_image_message", async ({ senderId, receiverId, groupId, fileUrl }) => {
            try {
                const filename = fileUrl.split('/').pop(); // Lấy "1759157697072.png"
                // Tạo message trong DB
                const message = {
                    senderId,
                    receiverId: receiverId || null,
                    groupId: groupId || null,
                    imageUrl: fileUrl,
                    createdAt: new Date(),
                    isRead: false
                };

                console.log("✅ Image message saved to DB:", message);
                console.log("🖼️  Image URL from DB:", message.imageUrl);

                // Gửi socket cho người nhận hoặc group
                if (receiverId) {
                    io.to(`user_${receiverId}`).emit("new_message", message);
                    io.to(`user_${senderId}`).emit("new_message", message);
                } else if (groupId) {
                    io.to(`group_${groupId}`).emit("new_message", message);
                }

                console.log("📷 Image message sent:", message);
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


        // ===== VIDEO CALL HANDLERS =====
        // Gửi lời mời gọi video
        socket.on("video_call_request", ({ callerId, receiverId, callerName }) => {
            console.log(`📞 Video call from ${callerId} to ${receiverId}`);
            
            io.to(`user_${receiverId}`).emit("incoming_video_call", {
                callerId,
                callerName,
                socketId: socket.id
            });
        });

        // Người nhận chấp nhận cuộc gọi
        socket.on("accept_video_call", ({ callerId, receiverId }) => {
            console.log(`✅ Call accepted: ${receiverId} accepted ${callerId}`);
            
            io.to(`user_${callerId}`).emit("video_call_accepted", {
                receiverId,
                socketId: socket.id
            });
        });

        // Người nhận từ chối cuộc gọi
        socket.on("reject_video_call", ({ callerId, receiverId }) => {
            console.log(`❌ Call rejected: ${receiverId} rejected ${callerId}`);
            
            io.to(`user_${callerId}`).emit("video_call_rejected", {
                receiverId
            });
        });

        // WebRTC Signaling: Gửi offer
        socket.on("video_offer", ({ offer, receiverId }) => {
            console.log(`📤 Sending offer to user ${receiverId}`);
            
            io.to(`user_${receiverId}`).emit("video_offer", {
                offer,
                senderId: socket.id
            });
        });

        // WebRTC Signaling: Gửi answer
        socket.on("video_answer", ({ answer, receiverId }) => {
            console.log(`📥 Sending answer to user ${receiverId}`);
            
            io.to(`user_${receiverId}`).emit("video_answer", {
                answer,
                senderId: socket.id
            });
        });

        // WebRTC Signaling: Trao đổi ICE candidates
        socket.on("ice_candidate", ({ candidate, receiverId }) => {
            io.to(`user_${receiverId}`).emit("ice_candidate", {
                candidate,
                senderId: socket.id
            });
        });

        // Kết thúc cuộc gọi
        socket.on("end_video_call", ({ receiverId }) => {
            console.log(`☎️ Call ended`);
            
            io.to(`user_${receiverId}`).emit("video_call_ended");
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

        // Nhắn tin nhóm
        socket.on("send_group_message", async ({ groupId, senderId, content}) => {
            io.to(`group_${groupId}`).emit('group_message', { groupId, senderId, content });
        })

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected");
            });
        });
    return io;
}

module.exports = { initSocket, getIO: () => io };
