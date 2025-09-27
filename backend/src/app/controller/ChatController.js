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
}

module.exports = new ChatController();