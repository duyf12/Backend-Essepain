const Product = require('../models/Product');

// 1. API TẠO SẢN PHẨM MỚI (Dùng để bạn tự nạp hàng mẫu bằng Postman)
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, image, stock } = req.body;

        const newProduct = new Product({
            name,
            price,
            description,
            image,
            stock
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công!', product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không tạo được sản phẩm.', error: error.message });
    }
};

// 2. API LẤY TẤT CẢ SẢN PHẨM (Để sau này hiển thị lên danh sách App)
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }); // Sản phẩm mới nhất xếp lên đầu
        res.status(200).json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi không lấy được danh sách sản phẩm.', error: error.message });
    }
};