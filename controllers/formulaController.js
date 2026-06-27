const Formula = require('../models/Formula');
const fs = require('fs');
const path = require('path');
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

exports.getFormulas = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let query = {};

        // 🔥 THAY ĐỔI TẠI ĐÂY: Dùng Regex thay cho $text để gõ từ nào cũng ra
        if (search && search.trim() !== "") {
            // "i" nghĩa là không phân biệt chữ hoa, chữ thường
            const searchRegex = new RegExp(search.trim(), "i");

            // Sử dụng $or để quét tất cả các trường, chỉ cần 1 trường chứa chữ "feng" là bốc ra luôn
            query.$or = [
                { colorCode: searchRegex },
                { carCompany: searchRegex },
                { standardColor: searchRegex },
                { note: searchRegex },
                { year: searchRegex },
                { 'colorDetails.color': searchRegex },
                { 'layerBottom.colorDetails.color': searchRegex },
                { 'layerTop.colorDetails.color': searchRegex }
            ];
        }

        // Thực hiện truy vấn dữ liệu và hiển thị thông tin người tạo công thức
        const formulas = await Formula.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 }) // Mặc định công thức mới nhất lên đầu
            .skip(skip)
            .limit(limitNumber);

        const totalRecords = await Formula.countDocuments(query);

        return res.status(200).json({
            success: true,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalRecords / limitNumber),
            totalRecords,
            data: formulas
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách công thức.',
            error: error.message
        });
    }
};
exports.deleteFormula = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy ID người dùng từ mã token đã đăng nhập
        const formulaId = req.params.id; // Lấy ID công thức truyền từ URL (Ví dụ: /api/formula/delete/60b8c...)

        // Tìm và xóa công thức thỏa mãn đồng thời 2 điều kiện:
        // 1. _id của công thức khớp với ID cần xóa
        // 2. userId trong công thức phải trùng với ID của người đang thực hiện lệnh xóa
        const deletedFormula = await Formula.findOneAndDelete({
            _id: formulaId,
            userId: userId
        });

        // Nếu không tìm thấy công thức hoặc công thức này thuộc về người khác
        if (!deletedFormula) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy công thức màu sơn hoặc bạn không có quyền xóa công thức này!'
            });
        }

        // TODO: Nếu bạn muốn xóa cả file ảnh vật lý lưu trên ổ đĩa VPS khi xóa công thức, 
        // bạn có thể sử dụng thêm thư viện `fs` của Node.js để quét mảng `deletedFormula.images` và xóa file.

        return res.status(200).json({
            success: true,
            message: 'Đã xóa công thức màu sơn thành công!'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi thực hiện xóa công thức màu sơn.',
            error: error.message
        });
    }
};
exports.updateFormula = async (req, res) => {
    try {
        const userId = req.user.userId;
        const formulaId = req.params.id;

        // 1. Kiểm tra quyền sở hữu công thức
        let formula = await Formula.findOne({ _id: formulaId, userId: userId });
        if (!formula) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy công thức hoặc bạn không có quyền chỉnh sửa công thức này!'
            });
        }

        // 2. Bóc tách và cập nhật thông tin text (Giữ nguyên logic của bạn)
        const {
            colorCode, year, standardColor, carCompany, note,
            hasThreeSteps, totalQuantity, colorDetails, layerBottom, layerTop
        } = req.body;

        if (colorCode) formula.colorCode = colorCode;
        if (year !== undefined) formula.year = year;
        if (standardColor !== undefined) formula.standardColor = standardColor;
        if (carCompany !== undefined) formula.carCompany = carCompany;
        if (note !== undefined) formula.note = note;

        if (hasThreeSteps !== undefined) {
            formula.hasThreeSteps = hasThreeSteps === 'true' || hasThreeSteps === true;
        }

        const safeParse = (data) => {
            if (typeof data === 'string') {
                try { return JSON.parse(data); } catch (e) { return []; }
            }
            return data;
        };

        if (!formula.hasThreeSteps) {
            if (totalQuantity !== undefined) formula.totalQuantity = totalQuantity;
            if (colorDetails !== undefined) formula.colorDetails = safeParse(colorDetails);
            formula.layerBottom = undefined;
            formula.layerTop = undefined;
        } else {
            if (layerBottom !== undefined) formula.layerBottom = safeParse(layerBottom);
            if (layerTop !== undefined) formula.layerTop = safeParse(layerTop);
            formula.totalQuantity = undefined;
            formula.colorDetails = [];
        }

        // 🔥 4. XỬ LÝ XÓA ẢNH CŨ TRÊN VPS VÀ CẬP NHẬT ẢNH MỚI
        if (req.files && req.files.length > 0) {

            if (formula.images) {
                let oldImagesArray = [];

                // 1. Ép dữ liệu ảnh cũ về dạng mảng chuẩn
                if (typeof formula.images === 'string') {
                    oldImagesArray = formula.images.split(',').filter(img => img.trim() !== "");
                } else if (Array.isArray(formula.images)) {
                    oldImagesArray = formula.images;
                }

                // 2. Duyệt qua từng ảnh cũ để xóa file vật lý
                oldImagesArray.forEach(imagePath => {
                    let relativePath = imagePath.trim();

                    // Bóc tách bỏ domain nếu có
                    if (relativePath.includes('http')) {
                        const parts = relativePath.split('/uploads/');
                        if (parts.length > 1) {
                            relativePath = 'uploads/' + parts[1];
                        }
                    } else {
                        // Nếu bắt đầu bằng dấu / thì bỏ đi để nối đường dẫn cho chuẩn
                        if (relativePath.startsWith('/')) {
                            relativePath = relativePath.substring(1);
                        }
                    }

                    // ĐỊNH VỊ ĐƯỜNG DẪN CHUẨN TRONG DOCKER (Ví dụ: /app/uploads/formulas/abc.jpg)
                    const fullPathToDelete = path.join(process.cwd(), relativePath);

                    // Tiến hành kiểm tra và xóa
                    if (fs.existsSync(fullPathToDelete)) {
                        try {
                            fs.unlinkSync(fullPathToDelete); // Dùng hàm đồng bộ Sync để chắc chắn xóa xong mới chạy tiếp
                            console.log(`👉 Đã xóa file ảnh cũ vĩnh viễn: ${fullPathToDelete}`);
                        } catch (unlinkError) {
                            console.error(`❌ Lỗi khi thực hiện xóa file ${fullPathToDelete}:`, unlinkError.message);
                        }
                    } else {
                        console.log(`⚠️ Không tìm thấy file vật lý tại vị trí: ${fullPathToDelete}`);
                    }
                });
            }

            // 3. Gán mảng ảnh mới hoàn toàn vào database
            const newImagePaths = req.files.map(file => `/uploads/formulas/${file.filename}`);
            formula.images = newImagePaths;
        }

        // 5. Lưu vào database
        await formula.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật công thức và đã dọn dẹp ảnh cũ thành công!',
            data: formula
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật công thức màu.',
            error: error.message
        });
    }
};