const Formula = require('../models/Formula');

// API Lưu công thức màu sơn mới
exports.saveFormula = async (req, res) => {
    try {
        const { colorCode, year, standardColor, carCompany, note, hasThreeSteps, totalQuantity, colorDetails, layerBottom, layerTop } = req.body;

        if (!colorCode) {
            return res.status(400).json({ success: false, message: 'Mã màu sơn không được bỏ trống!' });
        }

        // Tạo đối tượng công thức màu mới
        const newFormula = new Formula({
            colorCode,
            year,
            standardColor,
            carCompany,
            note,
            hasThreeSteps,
            userId: req.user.userId // 🔥 SỬA ĐÂY: Khớp với req.user từ verifyToken của bạn
        });

        if (!hasThreeSteps) {
            newFormula.totalQuantity = totalQuantity;
            newFormula.colorDetails = colorDetails;
        } else {
            newFormula.layerBottom = layerBottom;
            newFormula.layerTop = layerTop;
        }

        await newFormula.save();

        res.status(201).json({
            success: true,
            message: 'Lưu công thức màu sơn thành công!',
            data: newFormula
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lưu công thức màu.', error: error.message });
    }
};

// API Lấy toàn bộ danh sách công thức màu đã lưu của chính User đó
exports.getMyFormulas = async (req, res) => {
    try {
        // 🔥 SỬA ĐÂY: Tìm theo đúng req.user.userId
        const formulas = await Formula.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: formulas });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server không lấy được danh sách.', error: error.message });
    }
};
