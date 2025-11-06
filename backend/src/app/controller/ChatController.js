const ChatService = require("../service/ChatService");

class ChatController 
{
    async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const conversations = await ChatService.getConversations(userId);
            res.json(conversations);
        } catch (err) {
            console.error("❌ Error fetching conversations:", err);
            res.status(500).json({ message: "Lỗi server" });
        }
    }


    async getMessages(req, res) 
    {
        try {
            const userId = req.user.id;
            const receiverId = req.params.receiverId;
            const messages = await ChatService.getMessages(userId, receiverId);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });

        }
    }

    async deleteMessage(req, res)
    {
        try {
            const messageId = req.params.messageId;
            await ChatService.deleteMessage(messageId);
            res.json({ message: "Xóa tin nhắn thành công" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
}

module.exports = new ChatController();