const jwt = require('jsonwebtoken');

// Middleware 1: Kiểm tra xem người dùng có Token hợp lệ hay không (Đã đăng nhập chưa)
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Lấy token từ Header "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Từ chối truy cập! Không tìm thấy Token.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Lưu thông tin giải mã (userId, role) vào biến req.user để các hàm sau sử dụng
        next(); // Cho phép đi tiếp
    } catch (error) {
        res.status(400).json({ success: false, message: 'Mã Token không hợp lệ hoặc đã hết hạn.' });
    }
};

// Middleware 2: Kiểm tra xem có phải ADMIN hay không
exports.isAdmin = (req, res, next) => {
    // Sau khi đi qua verifyToken, req.user đã có dữ liệu role
    if (req.user && req.user.role === 'admin') {
        next(); // Đúng là Admin thì cho qua
    } else {
        return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối! Bạn không phải là Admin.' });
    }
};