// services/ChatService.js
const sequelize = require("../../config/db");
const { Message } = require("../model");
const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");

class ChatService {
    // Lưu tin nhắn mới (mặc định chưa đọc)
    static async saveMessage(senderId, receiverId, content) {
        return await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            is_read: false
        });
    }

    // Lấy tất cả tin nhắn giữa 2 người
    static async getMessages(userA, userB) {
        return await Message.findAll({
            where: {
                // lấy cả 2 chiều: A -> B và B -> A
                [Op.or]: [  
                    { sender_id: userA, receiver_id: userB },
                    { sender_id: userB, receiver_id: userA }
                ]
            },
            order: [["created_at", "ASC"]]
        });
    }

    // Lấy danh sách cuộc hội thoại cho user
    static async getConversations(userId) {
        const chats = await sequelize.query(
            `
            SELECT * FROM (
                -- Lấy nhóm
                SELECT 
                    g.id AS conversationId,
                    g.name AS conversationName,
                    COALESCE(MAX(m.created_at), g.created_at) AS lastTime, -- fallback nếu chưa có tin nhắn
                    SUBSTRING_INDEX(
                        SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
                        ',', -1
                    ) AS lastMessage,
                    COALESCE(SUM(CASE WHEN m.sender_id != :userId AND m.is_read = 0 THEN 1 ELSE 0 END), 0) AS unreadCount,
                    1 AS isGroup,
                    NULL AS id,
                    NULL AS name,
                    NULL AS email
                FROM groups g
                JOIN group_members gm ON gm.group_id = g.id
                LEFT JOIN messages m ON m.group_id = g.id
                WHERE gm.user_id = :userId
                GROUP BY g.id, g.name, g.created_at

                UNION ALL

                -- Lấy 1-1
                SELECT 
                    NULL AS conversationId,
                    NULL AS conversationName,
                    MAX(m.created_at) AS lastTime,
                    SUBSTRING_INDEX(
                        SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
                        ',', -1
                    ) AS lastMessage,
                    SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount,
                    0 AS isGroup,
                    u.id,
                    u.name,
                    u.email
                    FROM messages m
                    JOIN users u ON u.id = IF(m.sender_id = :userId, m.receiver_id, m.sender_id)
                    WHERE m.sender_id = :userId OR m.receiver_id = :userId
                    GROUP BY u.id, u.name, u.email
                ) AS merged
            ORDER BY lastTime DESC
            `,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        return chats;
    }


    // Đánh dấu tin nhắn là đã đọc
    static async markAsRead(userId, senderId) {
        return await Message.update(
            { is_read: 1 },
            {
                where: {
                    receiver_id: userId,
                    sender_id: senderId,
                    is_read: 0
                }
            }
        );
    }
}

module.exports = ChatService;
// SELECT 
//     NULL AS conversationId,
//     NULL AS conversationName,
//     MAX(m.created_at) AS lastTime,
//     SUBSTRING_INDEX(
//         SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
//         ',', -1
//     ) AS lastMessage,
//     SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount,
//     0 AS isGroup,
//     u.id,
//     u.name,
//     u.email
//     FROM messages m
//     JOIN users u ON u.id = IF(m.sender_id = :userId, m.receiver_id, m.sender_id)
//     WHERE m.sender_id = :userId OR m.receiver_id = :userId
//     GROUP BY u.id, u.name, u.email