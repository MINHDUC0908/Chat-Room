const { Message, Call } = require("../model");

class CallService {
    // ✅ Bắt đầu cuộc gọi (tạo call record)
    static async startCall(callerId, receiverId, type = "voice") {
        const call = await Call.create({
            caller_id: callerId,
            receiver_id: receiverId,
            type: type,
            status: "missed", // mặc định là missed
            started_at: null,
            ended_at: null,
            duration: null,
            message_id: null
        });

        // Tạo message placeholder (chưa biết kết quả)
        const message = await Message.create({
            sender_id: callerId,
            receiver_id: receiverId,
            content: `Cuộc gọi ${type === "video" ? "video" : "thoại"} đang gọi...`,
            is_read: false
        });

        // Liên kết message với call
        call.message_id = message.id;
        await call.save();

        return call;
    }

    // ✅ Cập nhật khi người nhận NGHE MÁY
    static async answerCall(callId) {
        const call = await Call.findByPk(callId, { include: "message" });
        if (!call) throw new Error("Cuộc gọi không tồn tại");

        // Cập nhật call
        call.status = "answered";
        call.started_at = new Date(); // ⏰ Lưu thời gian bắt đầu
        await call.save();

        // Cập nhật message
        if (call.message) {
            await call.message.update({
                content: `Cuộc gọi ${call.type === "video" ? "video" : "thoại"} đang diễn ra...`,
            });
        }

        return call;
    }
    
    // ✅ Cập nhật khi cuộc gọi KẾT THÚC hoặc BỊ TỪ CHỐI
    static async endCall(callId, status = "ended") {
        const call = await Call.findByPk(callId, { include: "message" });
        if (!call) throw new Error("Cuộc gọi không tồn tại");

        const endTime = new Date();
        
        // Tính duration (chỉ khi đã answered)
        let duration = 0;
        if (call.started_at) {
            duration = Math.floor((endTime - new Date(call.started_at)) / 1000); // giây
        }

        // Cập nhật call
        call.status = status;
        call.ended_at = endTime;
        call.duration = duration;
        await call.save();

        // Cập nhật message dựa trên trạng thái
        if (call.message) {
            let messageContent = "";
            
            if (status === "answered" || status === "ended") {
                // Cuộc gọi đã trả lời
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                messageContent = `Cuộc gọi ${call.type === "video" ? "video" : "thoại"} - ${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else if (status === "missed") {
                messageContent = `Cuộc gọi ${call.type === "video" ? "video" : "thoại"} nhỡ`;
            } else if (status === "rejected") {
                messageContent = `Cuộc gọi ${call.type === "video" ? "video" : "thoại"} bị từ chối`;
            }

            await call.message.update({
                content: messageContent,
            });
        }

        return call;
    }
}

module.exports = CallService;
