

function initGroupCallHandlers(socket, io) 
{
    // 📞 Bắt đầu cuộc gọi nhóm
    socket.on("start-group-call", async ({ groupId, senderId, offer, type = "voice" }) => {
        try {
            socket.to(`group_${groupId}`).emit("incoming-group-call", {
                groupId,
                from: senderId,
                offer,
                type
            });
            
            console.log(`📞 Group call started in group ${groupId} by user ${senderId}`);
        } catch (err) {
            console.error("❌ Error starting group call:", err);
            socket.emit("call-error", { message: err.message });
        }
    });

    // ✅ User tham gia cuộc gọi nhóm
    socket.on("join-group-call", ({ groupId, userId, offer }) => {
        console.log(`✅ User ${userId} joined group call in ${groupId}`);
        
        socket.to(`group_${groupId}`).emit("user-joined-call", {
            userId,
            offer
        });
    });

    // 🔄 Gửi answer lại cho user vừa join
    socket.on("answer-group-call", ({ groupId, fromUserId, toUserId, answer }) => {
        console.log(`🔄 Answer from ${fromUserId} to ${toUserId} in group ${groupId}`);
        
        io.to(`user_${toUserId}`).emit("group-call-answered", {
            from: fromUserId,
            answer
        });
    });

    // 🧊 ICE candidate cho group call
    socket.on("group-ice-candidate", ({ groupId, fromUserId, toUserId, candidate }) => {
        console.log(`🧊 ICE candidate from ${fromUserId} to ${toUserId}`);
        
        io.to(`user_${toUserId}`).emit("group-ice-candidate", {
            from: fromUserId,
            candidate
        });
    });

    // 📴 User rời khỏi cuộc gọi nhóm
    socket.on("leave-group-call", ({ groupId, userId }) => {
        console.log(`📴 User ${userId} left group call in ${groupId}`);
        
        socket.to(`group_${groupId}`).emit("user-left-call", { userId });
    });

    // 📴 Kết thúc cuộc gọi nhóm (host)
    socket.on("end-group-call", async ({ groupId, userId }) => {
        console.log(`📴 Group call ended in ${groupId} by ${userId}`);
        
        io.to(`group_${groupId}`).emit("group-call-ended", { 
            groupId,
            endedBy: userId 
        });
    });
}

module.exports = initGroupCallHandlers;