const { QueryTypes, Model } = require("sequelize");
const sequelize = require("../../config/db");
const { Group, GroupMember, GroupMessage, User } = require("../model");

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

    async getGroup(id) {
        try {
            const group = await Group.findByPk(id);

            if (!group) {
                throw new Error(`Nhóm với id ${id} không tồn tại`);
            }
            const memberCount = await GroupMember.count({
                where: { group_id: id }
            });

            return { ...group.toJSON(), memberCount };
        } catch (error) {
            console.error("❌ Lỗi khi lấy nhóm:", error);
            throw error;
        }
    }

    async createMessageGroup(groupId, senderId, content)
    {
        try {
            const mes = await GroupMessage.create({
                group_id: groupId,
                sender_id: senderId,
                content: content,
            });
            return mes
        } catch (error) {
            console.error("❌ Lỗi khi lấy nhóm:", error);
            throw error;
        }
    }

    async getAllMesGr(groupId) {
        try {
            const mes = await GroupMessage.findAll({
                where: { group_id: groupId },   
                include: [
                    {
                        model: User,   
                        as: "sender",
                        attributes: ["name", "email"] 
                    }
                ],
                order: [["created_at", "ASC"]]  
            });
            return mes;
        } catch (error) {
            console.error("❌ Lỗi khi lấy tin nhắn nhóm:", error);
            throw error;
        }
    }
}

module.exports = new GroupService();