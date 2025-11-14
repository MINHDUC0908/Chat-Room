const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (folderPath, type = 'image') => {
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Cấu hình lưu trữ file
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, folderPath);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    });

    // Cấu hình cho từng loại file
    const fileConfigs = {
        image: {
            allowedTypes: /jpeg|jpg|png|gif|webp/,
            maxSize: 5 * 1024 * 1024, // 5MB
            errorMessage: "Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)!"
        },
        video: {
            allowedTypes: /mp4|mov|avi|mkv|wmv|flv|webm/,
            maxSize: 100 * 1024 * 1024, // 100MB
            errorMessage: "Chỉ chấp nhận file video (mp4, mov, avi, mkv, wmv, flv, webm)!"
        },
        document: {
            allowedTypes: /pdf|doc|docx/,
            maxSize: 20 * 1024 * 1024, // 20MB
            errorMessage: "Chỉ chấp nhận file tài liệu (pdf, doc, docx)!"
        },
        both: {
            allowedTypes: /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|wmv|flv|webm/,
            maxSize: 100 * 1024 * 1024, // 100MB
            errorMessage: "Chỉ chấp nhận file ảnh hoặc video!"
        }
    };

    const config = fileConfigs[type] || fileConfigs.image;

    // Kiểm tra định dạng file
    const fileFilter = (req, file, cb) => {
        const extName = config.allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = config.allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error(config.errorMessage), false);
        }
    };

    return multer({
        storage: storage,
        limits: { fileSize: config.maxSize },
        fileFilter: fileFilter
    });
};

module.exports = createUploader;