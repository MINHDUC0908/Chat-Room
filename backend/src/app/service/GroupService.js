const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { Group, GroupMember } = require("../model");

class GroupService
{
    async createGroup(name, members = [], creatorId) {
        try {
            // 1. Tạo nhóm
            const group = await Group.create({
                name,
                created_by: creatorId
            });

            // 2. Thêm người tạo vào group
            await GroupMember.create({
                group_id: group.id,
                user_id: creatorId,
                role: "admin" // vai trò admin cho người tạo
            });

            // 3. Thêm các thành viên khác
            if (members.length > 0) {
                const bulkMembers = members.map(userId => ({
                    group_id: group.id,
                    user_id: userId,
                    role: "member"
                }));
                await GroupMember.bulkCreate(bulkMembers);
            }

            return group;
        } catch (err) {
            console.error("❌ Lỗi khi tạo group:", err);
            throw err;
        }
    }

    async getgroupAll()
    {
        try {
            const groups = await Group.findAll();
            return groups;
        } catch (error) {
            throw new Error("Lỗi khi lấy danh sách nhóm");
        }
    }

    async getGroups(userId) {
        const groups = await sequelize.query(
            `
            SELECT g.id AS conversationId,
                g.name AS conversationName,
                MAX(m.created_at) AS lastTime,
                SUBSTRING_INDEX(
                    SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC), ',', 1),
                    ',', -1
                ) AS lastMessage,
                COALESCE(SUM(CASE WHEN m.sender_id != :userId AND m.is_read = 0 THEN 1 ELSE 0 END), 0) AS unreadCount,
                1 AS isGroup
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            LEFT JOIN messages m ON m.group_id = g.id
            WHERE gm.user_id = :userId
            GROUP BY g.id, g.name
            ORDER BY 
                -- nhóm có tin nhắn sẽ lên đầu
                CASE WHEN MAX(m.created_at) IS NOT NULL THEN 0 ELSE 1 END,
                -- sắp xếp theo thời gian mới nhất
                MAX(m.created_at) DESC
            `,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );

        return groups;
    }
}

module.exports = new GroupService();