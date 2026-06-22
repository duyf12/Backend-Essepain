const Formula = require('../models/Formula');

// API Lưu công thức màu sơn mới
exports.saveFormula = async (req, res) => {
    try {
        const {
            colorCode,
            year,
            standardColor,
            carCompany,
            note,
            hasThreeSteps,
            totalQuantity,
            colorDetails,
            layerBottom,
            layerTop
        } = req.body;

        if (!colorCode) {
            return res.status(400).json({ success: false, message: 'Mã màu sơn không được bỏ trống!' });
        }

        // 1. XỬ LÝ ẢNH: Lấy danh sách đường dẫn các file ảnh được upload lên VPS
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/uploads/formulas/${file.filename}`);
        }

        // Tạo đối tượng công thức màu mới
        const newFormula = new Formula({
            colorCode,
            year,
            standardColor,
            carCompany,
            note,
            // Ép kiểu Boolean phòng trường hợp Form-Data gửi lên dạng string "true"/"false"
            hasThreeSteps: hasThreeSteps === 'true' || hasThreeSteps === true,
            userId: req.user.userId,
            images: imagePaths // 🔥 LƯU MẢNG ĐƯỜNG DẪN ẢNH VÀO DB
        });

        // Hàm helper để giải mã (parse) các trường mảng/object từ Form-Data gửi lên dạng String
        const safeParse = (data) => {
            if (typeof data === 'string') {
                try { return JSON.parse(data); } catch (e) { return []; }
            }
            return data;
        };

        // 2. PHÂN LOẠI LOGIC CÔNG THỨC THEO BƯỚC SƠN
        if (!newFormula.hasThreeSteps) {
            newFormula.totalQuantity = totalQuantity;
            newFormula.colorDetails = safeParse(colorDetails);
        } else {
            newFormula.layerBottom = safeParse(layerBottom);
            newFormula.layerTop = safeParse(layerTop);
        }

        // 3. Lưu vào database
        await newFormula.save();

        res.status(201).json({
            success: true,
            message: 'Lưu công thức màu sơn kèm hình ảnh thành công!',
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
