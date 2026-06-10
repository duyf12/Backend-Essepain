const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // 1. Đổi trường email cũ thành phone để dùng số điện thoại làm username
    phone: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // 2. Thêm 2 trường này để lưu mã OTP 6 số và thời gian hết hạn (5 phút) phục vụ tính năng quên mật khẩu
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },

    createdAt: { type: Date, default: Date.now }
});

// Bắt buộc phải export dòng này để các file khác gọi được User.findOne(), User.create()...
module.exports = mongoose.model('User', UserSchema);