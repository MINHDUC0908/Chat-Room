const { GroupMessage } = require("../model");

class GroupMessageService 
{
    static async createImageGroup(groupId, senderId, file)
    {
        try {
            if (!file) {
                throw new Error("Không có file nào được tải lên!");
            }
            // Đường dẫn public để client có thể truy cập
            const imageUrl = `/image/group/${file.filename}`;

            // Tạo bản ghi trong DB
            const newMessage = await GroupMessage.create({
                group_id: groupId,
                sender_id: senderId,
                content: "📷 Đã gửi 1 ảnh",
                image_url: imageUrl,
            });
            return {
                id: newMessage.id,
                groupId: newMessage.group_id,
                senderId: newMessage.sender_id,
                content: newMessage.content,
                imageUrl: newMessage.image_url,
                createdAt: newMessage.createdAt,
            };
        } catch (error) {
            console.error("❌ Lỗi khi tạo tin nhắn ảnh:", error);
            throw error;
        }
    }
}

module.exports = GroupMessageService;