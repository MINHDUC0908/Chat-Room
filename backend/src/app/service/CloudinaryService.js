const cloudinary_js_config = require('../../config/cloudinary');
const fs = require('fs');
const { Message } = require('../model');

class CloudinaryService
{
    static async uploadVideo(filePath, folder = 'videos', senderId, receiverId, originalName = null) {
        try {
            const fileSizeBytes = fs.statSync(filePath).size;
            const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

            const result = await cloudinary_js_config.uploader.upload(filePath, {
                resource_type: 'video',
                folder: folder,
                chunk_size: 6000000,
            });

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            const fileName = originalName || path.basename(filePath);

            await Message.create({
                sender_id: senderId,
                receiver_id: receiverId,
                content: `📹 Đã gửi 1 video`,
                video_url: result.secure_url,
                video_public_id: result.public_id,
                video_name: fileName,
                video_size: fileSizeMB,
                video_duration: result.duration ? `${Math.floor(result.duration / 60)}:${Math.floor(result.duration % 60).toString().padStart(2, '0')}` : null,
                is_read: false,
            });

            return {
                url: result.secure_url,
                public_id: result.public_id,
                duration: result.duration,
                format: result.format,
                width: result.width,
                height: result.height,
                resource_type: result.resource_type,
                name: fileName,
                size: fileSizeMB,
            };
        } catch (error) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw new Error(`Lỗi upload video: ${error.message}`);
        }
    }
}

module.exports = CloudinaryService;