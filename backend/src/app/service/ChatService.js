// services/ChatService.js
const sequelize = require("../../config/db");
const { Message } = require("../model");
const { QueryTypes } = require("sequelize");
const { Op } = require("sequelize");

class ChatService {
    static async saveMessage(senderId, receiverId, content) {
        return await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            content
        });
    }

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

    static async getConversations(userId) {
        const rows = await sequelize.query(
            `
            SELECT u.id, u.name, u.email,
                MAX(m.created_at) AS lastTime,
                SUBSTRING_INDEX(
                    SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
                    ',', -1
                ) AS lastMessage
            FROM messages m
            JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY u.id, u.name, u.email
            ORDER BY lastTime DESC
            `,
            {
                replacements: [userId, userId, userId],
                type: sequelize.QueryTypes.SELECT
            }
        );
        return rows;
    }

    static async getAllMessages(userId, receiverId) 
    {
        const rows = await sequelize.query (
            `SELECT * FROM messages
            WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC`,
            {
                replacements: [userId, receiverId, receiverId, userId],
                type: QueryTypes.SELECT
            }
        );
        return rows;
    }
}

module.exports = ChatService;
