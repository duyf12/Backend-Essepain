const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 180 // 🔥 Tự động xóa khỏi DB sau 180 giây (3 phút)
    }
});

module.exports = mongoose.model('Otp', otpSchema);