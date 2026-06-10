const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String }, // Đường dẫn link ảnh sản phẩm
    stock: { type: Number, required: true, default: 0 }, // Số lượng sản phẩm còn lại trong kho
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema)