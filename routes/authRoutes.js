const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
// 1. Đường link Đăng ký: POST http://localhost:3000/api/auth/register
router.post('/register', authController.register);

// 2. Đường link Đăng nhập: POST http://localhost:3000/api/auth/login
router.post('/login', authController.login);

// 3. Đường link Quên mật khẩu (Chuẩn hóa URL dạng gạch ngang): POST http://localhost:3000/api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// 4. Đường link Đặt lại mật khẩu (Chuẩn hóa URL dạng gạch ngang): POST http://localhost:3000/api/auth/reset-password
router.post('/reset-password', authController.resetPassword);
router.get('/check-token', authController.checkToken);
router.delete('/delete-account', verifyToken, authController.deleteAccount);
module.exports = router;