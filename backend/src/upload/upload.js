const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploader = (folderPath) => {
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    // Cấu hình lưu trữ file
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, folderPath); // Lưu file vào thư mục được truyền vào
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên file để tránh trùng lặp
        }
    });

    // Kiểm tra định dạng file
    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error("Chỉ chấp nhận file ảnh!"), false);
        }
    };

    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
        fileFilter: fileFilter
    });
};

module.exports = createUploader;