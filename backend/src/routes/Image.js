
const express = require("express");
const router = express.Router();
const path = require("path");
const createUploader = require("../upload/upload");
const ImageService = require("../app/service/ImageService");
const GroupMessageService = require("../app/service/GroupMessageService");
const CloudinaryService = require("../app/service/CloudinaryService");


const upload = createUploader(path.join(__dirname, "../public/image/message"));
const uploadGr = createUploader(path.join(__dirname, "../public/image/group"));
const videoUploader = createUploader(path.join(__dirname, "../public/video/mes"), "video");
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


router.post("/upload-group-image", uploadGr.single("image"), async (req, res) => {
    try {
        const { groupId } = req.body;
        const senderId = req.user.id
        const message = await GroupMessageService.createImageGroup(
            groupId,
            senderId,
            req.file
        );
        return res.json({ success: true, message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/upload-video', videoUploader.single('video'), async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.id;
        const originalName = req.file.originalname;
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có file video nào được upload' 
            });
        }

        // Upload lên Cloudinary
        const videoData = await CloudinaryService.uploadVideo(
            req.file.path,  // Đường dẫn file đã lưu tạm
            'message-videos', // Tên folder trên Cloudinary
            senderId,
            receiverId,
            originalName
        );
        return res.json({ 
            success: true, 
            video: videoData 
        });
    } catch (error) {
        console.error('Upload video error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});
module.exports = router;