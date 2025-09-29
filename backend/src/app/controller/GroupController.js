const GroupService = require("../service/GroupService");

class GroupController
{
    async createGroup(req, res)
    {
        try {
            const { name, members } = req.body;
            const creatorId = req.user.id;
            if (!name) {
                return res.status(400).json({ message: "Thiếu tên nhóm" });
            }
            const group = await GroupService.createGroup(name, members, creatorId);
            res.status(201).json({ message: "Tạo nhóm thành công", group });
        }
        catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }

    async getgroupAll(req, res)
    {
        try {
            const groups = await GroupService.getgroupAll();
            res.status(200).json(groups);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }

    async getGroups(req, res)
    {
        try {
            const userId = req.user.id;
            const members = await GroupService.getGroups(userId);
            res.status(200).json(members);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
}

module.exports = new GroupController();