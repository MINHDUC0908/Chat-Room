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
                -- 🟢 Lấy nhóm chat
                SELECT 
                    g.id AS conversationId,
                    g.name AS conversationName,
                    COALESCE(MAX(gm.created_at), g.created_at) AS lastTime,
                    SUBSTRING_INDEX(
                        SUBSTRING_INDEX(GROUP_CONCAT(gm.content ORDER BY gm.created_at DESC), ',', 1),
                        ',', -1
                    ) AS lastMessage,
                    (
                        SELECT u3.id FROM users u3
                        JOIN group_messages m ON m.sender_id = u3.id
                        WHERE m.group_id = g.id
                        ORDER BY m.created_at DESC LIMIT 1
                    ) AS lastSenderId,
                    0 AS unreadCount,
                    1 AS isGroup,
                    NULL AS id,
                    (
                        SELECT u3.name FROM users u3
                        JOIN group_messages m ON m.sender_id = u3.id
                        WHERE m.group_id = g.id
                        ORDER BY m.created_at DESC LIMIT 1
                    ) AS name,
                    NULL AS email,
                    NULL AS is_online,
                    NULL AS last_active
                FROM groups g
                JOIN group_members gb ON gb.group_id = g.id
                LEFT JOIN group_messages gm ON gm.group_id = g.id
                WHERE gb.user_id = :userId
                GROUP BY g.id, g.name, g.created_at

                UNION ALL

                -- 🟣 Lấy hội thoại 1-1
                SELECT 
                    NULL AS conversationId,
                    NULL AS conversationName,
                    MAX(m.created_at) AS lastTime,
                    SUBSTRING_INDEX(
                        SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
                        ',', -1
                    ) AS lastMessage,
                    (
                        SELECT m2.sender_id FROM messages m2
                        WHERE (m2.sender_id = :userId AND m2.receiver_id = u.id)
                        OR (m2.sender_id = u.id AND m2.receiver_id = :userId)
                        ORDER BY m2.created_at DESC LIMIT 1
                    ) AS lastSenderId,
                    SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount,
                    0 AS isGroup,
                    u.id,
                    u.name,
                    u.email,
                    u.is_online,
                    u.last_active
                FROM messages m
                JOIN users u ON u.id = IF(m.sender_id = :userId, m.receiver_id, m.sender_id)
                WHERE m.sender_id = :userId OR m.receiver_id = :userId
                GROUP BY u.id, u.name, u.email
            ) AS merged
            ORDER BY lastTime DESC
            `,
            {
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT
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