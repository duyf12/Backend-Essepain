const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Ai mua?
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    items: [
        {
            // 🔥 ĐÃ SỬA: Thay đổi type từ mongoose.Schema.Types.ObjectId sang String và bỏ ref: 'Product'
            productId: { type: String, required: true }, // Mua món gì? Chấp nhận mọi định dạng ID ("1", "SP-01"...)
            quantity: { type: Number, required: true }, // Mua bao nhiêu cái?
            priceAtPurchase: { type: Number, required: true }, // Lưu giá lúc mua (phòng hờ sau này sản phẩm tăng/giảm giá)
            code: {
                type: String,
                required: true // 🔥 BẮT BUỘC: Thêm dòng này để MongoDB cho phép lưu mã sản phẩm
            },
        }
    ],
    totalAmount: { type: Number, required: true }, // Tổng tiền của cả đơn hàng
    shippingAddress: { type: String, required: true }, // Địa chỉ nhận hàng
    status: { type: String, default: 'PENDING' }, // Trạng thái đơn: PENDING, SHIPPING, DELIVERED, CANCELLED
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);