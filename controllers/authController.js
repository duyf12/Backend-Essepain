
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Formula = require('../models/Formula');

// Model Thợ sơn / Khách hàng của bạn
const Otp = require('../models/Otp');
const smsService = require('../services/smsService');

// 1. HÀM ĐĂNG KÝ (Sử dụng phone)
// 1. HÀM ĐĂNG KÝ (REGISTER - Đăng ký xong tự động đăng nhập)
exports.register = async (req, res) => {
    try {
        const { phone, password, role } = req.body;

        // Kiểm tra xem số điện thoại này đã được đăng ký chưa
        const userExists = await User.findOne({ phone });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng!' });
        }

        // Mã hóa (băm) mật khẩu để bảo mật
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới và lưu vào DB
        const newUser = new User({
            phone,
            password: hashedPassword,
            role: role || 'user'
        });

        // Lưu vào cơ sở dữ liệu
        await newUser.save();

        // 🔥 KÍCH HOẠT LUỒNG TỰ ĐỘNG ĐĂNG NHẬP:
        // Tạo JWT Token ngay lập tức cho user mới vừa tạo (hạn 7 ngày giống hàm login)
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Trả về đầy đủ success, message, token và thông tin user giống hệt hàm login
        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản và đăng nhập thành công!',
            token: token,
            user: {
                id: newUser._id,
                phone: newUser.phone,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server hệ thống.', error: error.message });
    }
};

// 2. HÀM ĐĂNG NHẬP (Sử dụng phone)
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body; // <-- Đổi email thành phone

        const user = await User.findOne({ phone }); // <-- Tìm theo phone
        if (!user) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác!' });
        }

        // Bỏ cả userId và role vào Token để sau này kiểm tra quyền
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token: token,
            user: {
                id: user._id,
                phone: user.phone, // <-- Trả về phone cho Client
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server hệ thống.', error: error.message });
    }
};

// 3. HÀM YÊU CẦU QUÊN MẬT KHẨU (Gửi OTP)
exports.forgotPassword = async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Số điện thoại này không tồn tại trên hệ thống!' });
        }

        // 1. Tạo mã OTP ngẫu nhiên gồm 6 chữ số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Lưu OTP và thời gian hết hạn (5 phút) vào Database
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        // 3. 🔥 IN MÃ OTP RA TERMINAL ĐỂ BẠN LẤY COPPY TEST MIỄN PHÍ
        console.log(`\n====================================`);
        console.log(`💬 GIẢ LẬP GỬI ZALO ZNS ĐẾN SỐ: ${phone}`);
        console.log(`🔑 MÃ OTP CỦA BẠN LÀ: ${otp}`);
        console.log(`====================================\n`);

        // 4. Trả phản hồi về cho Postman/App React Native
        res.status(200).json({
            success: true,
            message: 'Hệ thống đã gửi mã OTP xác thực về Zalo của bạn! (Hãy nhìn vào Terminal VS Code để lấy mã)'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý OTP.', error: error.message });
    }
};

// 4. HÀM NHẬP OTP ĐỂ ĐẶT LẠI MẬT KHẨU MỚI (Bổ sung để hoàn thành luồng)
exports.resetPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;

        // Tìm user có đúng số điện thoại, đúng mã OTP và mã OTP đó còn hạn
        const user = await User.findOne({
            phone: phone,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn!' });
        }

        // Tiến hành băm mật khẩu mới và lưu lại
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Xóa mã OTP đi sau khi đã đổi thành công
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi đặt lại mật khẩu.', error: error.message });
    }
};
exports.checkToken = async (req, res) => {
    try {
        // Lấy token từ header "Authorization" do App gửi lên
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Không tìm thấy token hợp lệ!' });
        }

        const token = authHeader.split(' ')[1];

        // Giải mã và xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm user trong Database dựa vào userId đã giải mã từ token
        const user = await User.findById(decoded.userId).select('-password'); // -password nghĩa là giấu mật khẩu đi, không trả về client

        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không tồn tại trên hệ thống!' });
        }

        // Nếu mọi thứ OK, trả về thông tin user mới nhất (bao gồm cả role mới nhất)
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        // Nếu token hết hạn hoặc fake, lệnh jwt.verify sẽ văng vào đây
        res.status(401).json({ success: false, message: 'Token đã hết hạn hoặc không hợp lệ!', error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        // ID của user được verifyToken giải mã và nạp sẵn vào req.user.userId (mấu chốt bạn vừa nắm được)
        const userId = req.user.userId;

        // 1. Kiểm tra xem user có tồn tại không
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản trên hệ thống!' });
        }

        // 2. XÓA SẠCH CÔNG THỨC MÀU SƠN CỦA USER NÀY TRƯỚC
        // Tìm tất cả các bản ghi trong bảng formulas có userId trùng khớp và xóa bỏ chúng
        await Formula.deleteMany({ userId: userId });

        // 3. XÓA TÀI KHOẢN USER
        await User.findByIdAndDelete(userId);

        // 4. Trả về kết quả thành công
        res.status(200).json({
            success: true,
            message: 'Tài khoản của bạn và toàn bộ công thức màu sơn đã được xóa vĩnh viễn!'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa tài khoản.', error: error.message });
    }
};
exports.forgotPasswordSMS = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại!' });
        }

        // 1. Kiểm tra xem số điện thoại đã tồn tại chưa
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Số điện thoại này chưa được đăng ký!' });
        }

        // 2. Tạo mã OTP ngẫu nhiên gồm 6 chữ số
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Xóa các mã OTP cũ của số điện thoại này (nếu có) để tránh rác DB
        await Otp.deleteMany({ phone });

        // 4. Lưu mã OTP mới vào MongoDB
        const newOtp = new Otp({ phone, code: otpCode });
        await newOtp.save();

        // 5. Gọi Service bắn tin nhắn SMS về máy người dùng
        await smsService.sendOTP(phone, otpCode);

        // 6. Trả phản hồi về cho App React Native
        return res.status(200).json({
            success: true,
            message: 'Mã OTP xác minh đã được gửi thành công!'
        });

    } catch (error) {
        console.error("Lỗi xử lý quên mật khẩu:", error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống.', error: error.message });
    }
};