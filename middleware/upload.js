const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/formulas/'); // Thư mục đã tạo ở Bước 1
    },
    filename: function (req, file, cb) {
        // Tên file = thời gian hiện tại + số ngẫu nhiên + đuôi mở rộng (.jpg/.png)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Chỉ cho phép upload định dạng ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG hoặc WEBP!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn tối đa 5MB mỗi file
});

module.exports = upload;