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

exports.getFormulas = async (req, res) => {
    try {
        // 🔥 ĐÃ THAY ĐỔI: Bỏ lọc theo userId để lấy công thức của TẤT CẢ mọi người
        const { search, page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Bộ lọc ban đầu để trống (nghĩa là lấy toàn bộ bảng)
        let query = {};

        // Nếu có từ khóa tìm kiếm (Full-Text Search)
        if (search && search.trim() !== "") {
            query.$text = { $search: search };
        }

        // Tạo câu lệnh truy vấn dữ liệu
        let formulasQuery = Formula.find(query);

        // 🔥 ĐÃ THÊM: Liên kết dữ liệu để lấy thêm Tên/Email của người tạo công thức (Tham khảo)
        formulasQuery = formulasQuery.populate('userId', 'name email');

        if (query.$text) {
            // Sắp xếp theo độ trùng khớp từ khóa cao nhất lên đầu
            formulasQuery = formulasQuery
                .select({ score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" } });
        } else {
            // Mặc định đưa công thức mới chia sẻ lên đầu
            formulasQuery = formulasQuery.sort({ createdAt: -1 });
        }

        // Thực hiện phân trang và lấy dữ liệu
        const formulas = await formulasQuery.skip(skip).limit(limitNumber);

        // Đếm tổng số lượng bản ghi công thức công khai trong hệ thống
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
            message: 'Lỗi server khi lấy danh sách công thức cộng đồng.',
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
        const userId = req.user.userId; // Xác thực thợ sơn
        const formulaId = req.params.id; // ID công thức cần sửa lấy từ URL

        // 1. Kiểm tra công thức này có tồn tại và thuộc quyền sở hữu của User này không
        let formula = await Formula.findOne({ _id: formulaId, userId: userId });
        if (!formula) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy công thức hoặc bạn không có quyền chỉnh sửa công thức này!'
            });
        }

        // 2. Bóc tách các trường dữ liệu text gửi lên từ Form-Data
        const {
            colorCode, year, standardColor, carCompany, note,
            hasThreeSteps, totalQuantity, colorDetails, layerBottom, layerTop
        } = req.body;

        if (colorCode) formula.colorCode = colorCode;
        if (year !== undefined) formula.year = year;
        if (standardColor !== undefined) formula.standardColor = standardColor;
        if (carCompany !== undefined) formula.carCompany = carCompany;
        if (note !== undefined) formula.note = note;

        // Ép kiểu Boolean cho biến phân loại luồng sơn
        if (hasThreeSteps !== undefined) {
            formula.hasThreeSteps = hasThreeSteps === 'true' || hasThreeSteps === true;
        }

        // Hàm hỗ trợ giải mã chuỗi JSON từ Form-Data
        const safeParse = (data) => {
            if (typeof data === 'string') {
                try { return JSON.parse(data); } catch (e) { return []; }
            }
            return data;
        };

        // 3. Cập nhật logic các thành phần tinh màu dựa vào số bước sơn
        if (!formula.hasThreeSteps) {
            if (totalQuantity !== undefined) formula.totalQuantity = totalQuantity;
            if (colorDetails !== undefined) formula.colorDetails = safeParse(colorDetails);
            // Xóa dữ liệu luồng 3 bước cũ (nếu có) để tránh rác data
            formula.layerBottom = undefined;
            formula.layerTop = undefined;
        } else {
            if (layerBottom !== undefined) formula.layerBottom = safeParse(layerBottom);
            if (layerTop !== undefined) formula.layerTop = safeParse(layerTop);
            // Xóa dữ liệu luồng sơn thường cũ
            formula.totalQuantity = undefined;
            formula.colorDetails = [];
        }

        // 4. XỬ LÝ HÌNH ẢNH MỚI (Nếu thợ sơn có chụp thêm ảnh hoặc thay ảnh)
        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/uploads/formulas/${file.filename}`);

            // LỰA CHỌN: Gộp ảnh mới vào mảng ảnh cũ đã có vĩnh viễn trên Docker
            formula.images = [...formula.images, ...newImagePaths];

            // HOẶC nếu bạn muốn THAY THẾ TOÀN BỘ ẢNH CŨ bằng ảnh mới, hãy dùng dòng dưới:
            // formula.images = newImagePaths;
        }

        // 5. Lưu lại vào MongoDB
        await formula.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật công thức màu sơn thành công!',
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