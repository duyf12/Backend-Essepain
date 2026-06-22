const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const path = require('path');
const formulaRoutes = require('./routes/formulaRoutes');
// Cấu hình dotenv để đọc file .env
dotenv.config();


const app = express();
app.use(cors());
// Middleware để Server đọc được dữ liệu JSON từ React Native gửi lên
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Kết nối MongoDB (Thay chuỗi kết nối bằng link của bạn)
const DB_CONNECTION = process.env.MONGO_URI;
mongoose.connect(DB_CONNECTION)
    .then(() => console.log('✅ Đã kết nối thành công tới MongoDB'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Test thử một API đơn giản
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/formula', formulaRoutes);
app.get('/', (req, res) => {
    res.send('Server Node.js đang chạy ngon lành!');
});
// Chạy Server ở cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});