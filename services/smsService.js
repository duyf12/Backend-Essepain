const axios = require('axios');

const smsService = {
    sendOTP: async (phone, otpCode) => {
        try {
            // Thông tin tài khoản eSMS của bạn
            const API_KEY = "B6DA5EE1D699497291F662848C2595";
            const SECRET_KEY = "EC9C28120D2A19CBE5BDFA7C51A0C8";

            // Tên hiển thị khi gửi. Lưu ý: Lúc đang test, bạn có thể phải dùng Brandname thử nghiệm của eSMS 
            // (ví dụ: Baogia, Notify, QCA...) theo quy định của họ trước khi duyệt tên "Essepaint".
            const BRANDNAME = "Essepaint";

            // Nội dung tin nhắn không dấu
            const content = `Ma OTP khoi phuc mat khau Essepaint cua ban la ${otpCode}. Ma co hieu luc trong 3 phut.`;

            // Gọi API gửi tin nhắn của eSMS
            const response = await axios.get('http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get', {
                params: {
                    Phone: phone,
                    Content: content,
                    ApiKey: API_KEY,
                    SecretKey: SECRET_KEY,
                    Brandname: BRANDNAME,
                    SmsType: 2 // Loại tin nhắn CSKH / OTP
                }
            });

            console.log("👉 Kết quả từ eSMS.vn:", response.data);
            return response.data;

        } catch (error) {
            console.error("❌ Lỗi kết nối API eSMS:", error.message);
            return null;
        }
    }
};

module.exports = smsService;