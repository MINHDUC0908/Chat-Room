function initGroupCallHandlers(socket, io) {
    // Map lưu cuộc gọi: { groupId: { members: Set, startTime: number } }
    if (!global.groupCalls) global.groupCalls = new Map();
    const groupCalls = global.groupCalls;

    // KIỂM TRA CUỘC GỌI ĐANG DIỄN RA
    socket.on("check-active-calls", ({ userId }) => {
        const activeCalls = [];
        
        // Lấy tất cả nhóm mà user tham gia
        const userRooms = Array.from(socket.rooms).filter(room => room.startsWith('group_'));
        
        userRooms.forEach(room => {
            const groupId = room.replace('group_', '');
            const call = groupCalls.get(groupId);
            
            if (call && call.members.size > 0) {
                activeCalls.push({
                    groupId,
                    startTime: call.startTime,
                    participants: Array.from(call.members)
                });
            }
        });

        socket.emit("active-calls-list", { activeCalls });
    });

    // BẮT ĐẦU GỌI NHÓM
    socket.on("start-group-call", ({ groupId, senderId, startTime }) => {
        console.log(`[CALL] ${senderId} bắt đầu gọi nhóm ${groupId}`);

        // Nếu chưa có cuộc gọi -> tạo mới
        if (!groupCalls.has(groupId)) {
            groupCalls.set(groupId, {
                members: new Set(),
                startTime: startTime || Date.now(),
            });
        }

        const call = groupCalls.get(groupId);
        call.members.add(senderId);

        // Thông báo đến nhóm có cuộc gọi đến (bao gồm startTime)
        socket.to(`group_${groupId}`).emit("incoming-group-call", {
            groupId,
            from: senderId,
            startTime: call.startTime, // ← GỬI STARTTIME
        });

        // Gửi lại cho người gọi biết thời gian bắt đầu
        socket.emit("call-initiated", {
            groupId,
            participants: Array.from(call.members),
            startTime: call.startTime,
        });
    });

    // THAM GIA CUỘC GỌI
    socket.on("user-joined-group-call", ({ groupId, userId }) => {
        console.log(`[CALL] ${userId} tham gia nhóm ${groupId}`);

        if (!groupCalls.has(groupId)) {
            groupCalls.set(groupId, {
                members: new Set(),
                startTime: Date.now(),
            });
        }

        const call = groupCalls.get(groupId);
        call.members.add(userId);

        const participants = Array.from(call.members);

        // Thông báo cho tất cả thành viên (bao gồm startTime)
        io.to(`group_${groupId}`).emit("user-joined-call", {
            userId,
            allParticipants: participants,
            startTime: call.startTime, // ← GỬI STARTTIME
        });

        // Gửi startTime RIÊNG cho user mới (đảm bảo sync)
        io.to(`user_${userId}`).emit("group-call-info", {
            startTime: call.startTime
        });
    });

    // GỬI OFFER
    socket.on("send-offer-to-group", ({ groupId, fromUserId, toUserId, offer }) => {
        console.log(`[RTC] OFFER từ ${fromUserId} → ${toUserId || "broadcast"}`);

        if (toUserId) {
            io.to(`user_${toUserId}`).emit("receive-offer", {
                fromUserId,
                offer,
                groupId,
            });
        } else {
            socket.to(`group_${groupId}`).emit("receive-offer", {
                fromUserId,
                offer,
                groupId,
            });
        }
    });

    // GỬI ANSWER
    socket.on("send-answer-to-user", ({ groupId, fromUserId, toUserId, answer }) => {
        console.log(`[RTC] ANSWER từ ${fromUserId} → ${toUserId}`);

        io.to(`user_${toUserId}`).emit("receive-answer", {
            fromUserId,
            answer,
            groupId,
        });
    });

    // GỬI ICE CANDIDATE
    socket.on("send-ice-candidate", ({ fromUserId, toUserId, candidate, groupId }) => {
        io.to(`user_${toUserId}`).emit("receive-ice-candidate", {
            fromUserId,
            candidate,
            groupId,
        });
    });

    // RỜI CUỘC GỌI
    socket.on("leave-group-call", ({ groupId, userId }) => {
        const call = groupCalls.get(groupId);
        if (!call) return;

        call.members.delete(userId);

        const remaining = Array.from(call.members);

        io.to(`group_${groupId}`).emit("user-left-call", {
            userId,
            remainingParticipants: remaining,
        });

        // Nếu không còn ai → xoá cuộc gọi
        if (call.members.size === 0) {
            groupCalls.delete(groupId);
            console.log(`[CALL] Nhóm ${groupId} kết thúc (không còn ai).`);
        }
    });

    // KẾT THÚC CUỘC GỌI TOÀN NHÓM
    socket.on("end-group-call", ({ groupId, userId }) => {
        groupCalls.delete(groupId);

        io.to(`group_${groupId}`).emit("group-call-ended", { endedBy: userId });
    });

    // NGẮT KẾT NỐI BẤT NGỜ
    socket.on("disconnect", () => {
        const userId = socket.userId;
        if (!userId) return;
        groupCalls.forEach((call, groupId) => {
            if (call.members.has(userId)) {
                call.members.delete(userId);

                io.to(`group_${groupId}`).emit("user-left-call", {
                    userId,
                    remainingParticipants: Array.from(call.members),
                });

                if (call.members.size === 0) {
                    groupCalls.delete(groupId);
                }
            }
        });
    });
}

module.exports = initGroupCallHandlers;