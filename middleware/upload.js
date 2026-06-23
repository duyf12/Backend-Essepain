const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Thêm thư viện fs để thao tác với ổ đĩa

// 1. Xác định đường dẫn tuyệt đối chuẩn xác cho Docker và Node.js
const uploadDir = path.resolve(process.cwd(), 'uploads/formulas');

// 2. Kiểm tra nếu thư mục 'uploads/formulas' chưa có thì tự động tạo ra (recursive: true giúp tạo cả thư mục cha lẫn con)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 3. Truyền biến uploadDir đã được kiểm tra/tạo ở trên vào đây thay vì chuỗi chữ tương đối
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tên file = thời gian hiện tại + số ngẫu nhiên + đuôi mở rộng (.jpg/.png)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Chỉ cho phép upload định dạng ảnh (Giữ nguyên logic chuẩn của bạn)
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