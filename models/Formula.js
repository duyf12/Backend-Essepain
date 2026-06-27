const mongoose = require('mongoose');

// Định nghĩa cấu trúc từng màu thành phần trộn vào công thức
const ColorDetailSchema = new mongoose.Schema({
    color: { type: String, required: true }, // Mã màu hoặc tên màu tinh
    amount: { type: Number, required: true } // Khối lượng tính bằng gram (g)
});

const FormulaSchema = new mongoose.Schema({
    // Thông tin chung của xe
    colorCode: { type: String, required: true, index: true }, // Mã màu sơn (Ví dụ: NH-731P)
    year: { type: String }, // Năm sản xuất xe
    standardColor: { type: String }, // Tên màu tiêu chuẩn
    carCompany: { type: String }, // Hãng xe (Ví dụ: Honda, Toyota)
    note: { type: String }, // Ghi chú khi pha màu

    // Check phân loại luồng sơn thường hay sơn 3 bước
    hasThreeSteps: { type: Boolean, default: false },

    // LUỒNG 1: Sử dụng nếu hasThreeSteps = false
    totalQuantity: { type: Number }, // Tổng lượng sơn thường (g)
    colorDetails: [ColorDetailSchema], // Mảng danh sách các màu thành phần

    // LUỒNG 2: Sử dụng nếu hasThreeSteps = true (Sơn 2 tầng tinh xảo)
    layerBottom: {
        totalQuantity: { type: Number },
        colorDetails: [ColorDetailSchema]
    },
    layerTop: {
        totalQuantity: { type: Number },
        colorDetails: [ColorDetailSchema]
    },

    // Lưu vết người tạo công thức màu này
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    images: [{ type: String }]
});
FormulaSchema.index(
    {
        colorCode: 'text',
        carCompany: 'text',
        standardColor: 'text',
        note: 'text',
        year: 'text',

        // 👇 ĐÂY CHÍNH LÀ NƠI TÌM KIẾM THEO TINH MÀU THÀNH PHẦN:
        'colorDetails.color': 'text',             // Tìm trong mảng tinh màu sơn thường
        'layerBottom.colorDetails.color': 'text', // Tìm trong mảng tinh màu lớp dưới (Sơn 3 bước)
        'layerTop.colorDetails.color': 'text'     // Tìm trong mảng tinh màu lớp trên (Sơn 3 bước)
    },
    {
        weights: {
            colorCode: 5,
            carCompany: 3,
            standardColor: 2,

            // 👇 Thiết lập độ ưu tiên (Trọng số) khi tìm thấy tên tinh màu
            'colorDetails.color': 2,
            'layerBottom.colorDetails.color': 2,
            'layerTop.colorDetails.color': 2,

            year: 1,
            note: 1
        },
        name: "FormulaTextIndex"
    }
);
module.exports = mongoose.model('Formula', FormulaSchema);