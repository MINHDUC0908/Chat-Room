const path = require("path");
const { Message } = require("../model");


class ImageService {
    /**
     * Tạo tin nhắn dạng ảnh
     * @param {number} senderId - ID người gửi
     * @param {number|null} receiverId - ID người nhận (tin nhắn cá nhân)
     * @param {number|null} groupId - ID nhóm (tin nhắn nhóm)
     * @param {object} file - file do multer upload
     */
    static async createImageMessage(senderId, receiverId = null, groupId = null, file) {
        try {
            if (!file) {
                throw new Error("Không có file nào được tải lên!");
            }

            // Đường dẫn public để client có thể truy cập
            const imageUrl = `/image/message/${file.filename}`;

            // Tạo bản ghi trong DB
            const newMessage = await Message.create({
                sender_id: senderId,
                receiver_id: receiverId,
                group_id: groupId,
                content: null,
                image_url: imageUrl,
                is_read: false
            });
            return {
                id: newMessage.id,
                senderId: newMessage.sender_id,
                receiverId: newMessage.receiver_id,
                groupId: newMessage.group_id,
                content: newMessage.content,
                imageUrl: newMessage.image_url,
                isRead: newMessage.is_read,
                createdAt: newMessage.createdAt,
            };
        } catch (error) {
            console.error("❌ Lỗi khi tạo tin nhắn ảnh:", error);
            throw error;
        }
    }
}

module.exports = ImageService;
