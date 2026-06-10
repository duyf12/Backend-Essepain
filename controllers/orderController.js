const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
    try {
        // 🔥 SỬA: Không lấy userId từ req.body nữa, lấy thẳng từ Token thông qua verifyToken
        const userId = req.user.userId;
        const { items, shippingAddress, recipientName, recipientPhone } = req.body;
        // 1. Kiểm tra xem giỏ hàng gửi lên có trống không
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống!' });
        }

        let totalAmount = 0;
        const orderItems = [];

        // 2. Duyệt qua từng sản phẩm trong giỏ hàng gửi lên
        for (const item of items) {
            // 🔥 SỬA: Bỏ hoàn toàn việc tìm kiếm Product.findById, check stock, và trừ stock.
            // Hệ thống lấy trực tiếp price và quantity từ client gửi lên để tính toán

            const itemPrice = item.price || 0; // Đề phòng client quên không gửi giá
            const itemQuantity = item.quantity || 1;

            // Tính tổng tiền dựa trên giá client gửi
            totalAmount += itemPrice * itemQuantity;

            // Đẩy thẳng vào mảng lưu vết đơn hàng
            orderItems.push({
                productId: item.productId,
                quantity: itemQuantity,
                priceAtPurchase: itemPrice
            });
        }

        // 3. Tạo đơn hàng mới với userId lấy từ Token bảo mật
        const newOrder = new Order({
            userId, // Lưu vết chính xác ông nào mua
            recipientName,   // 🔥 Lưu tên người nhận
            recipientPhone,
            items: orderItems,
            totalAmount,
            shippingAddress
        });

        // 4. Lưu đơn hàng vào Database (bảng orders)
        await newOrder.save();

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            order: newOrder,
            orderId: newOrder._id,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đặt hàng.', error: error.message });
    }
};
exports.getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params; // Lấy userId từ trên đường dẫn URL (ví dụ: /api/orders/user/123456)

        // Tìm tất cả đơn hàng có userId này, xếp đơn mới nhất lên đầu
        // Hàm .populate('items.productId', 'name price image') giúp lấy thêm thông tin chi tiết (tên, giá, ảnh) của sản phẩm đó từ bảng Product
        const orders = await Order.find({ userId })
            .populate('items.productId', 'name price image')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn hàng.', error: error.message });
    }
};
exports.getAllOrders = async (req, res) => {
    try {
        // Lấy sạch sành sanh đơn hàng trong DB, đồng thời có thể dùng .populate('userId', 'name phone') 
        // để lôi thêm thông tin tài khoản gốc nếu cần. Sắp xếp đơn mới nhất lên đầu.
        const allOrders = await Order.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: allOrders.length,
            data: allOrders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy toàn bộ đơn hàng.', error: error.message });
    }
};