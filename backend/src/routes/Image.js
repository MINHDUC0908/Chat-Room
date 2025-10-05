
const express = require("express");
const router = express.Router();
const path = require("path");
const createUploader = require("../upload/upload");
const ImageService = require("../app/service/ImageService");


const upload = createUploader(path.join(__dirname, "../public/image/message"));


// API upload ảnh và tạo message
router.post("/upload-message-image", upload.single("image"), async (req, res) => {
    try {
        const { receiverId, groupId } = req.body;
        const senderId = req.user.id
        const message = await ImageService.createImageMessage(
            senderId,
            receiverId || null,
            groupId || null,
            req.file
        );

        return res.json({ success: true, message });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;