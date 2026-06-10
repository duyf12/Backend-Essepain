const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); // <-- THÊM DÒNG NÀY

// 1. Link thêm sản phẩm: PHẢI QUA 2 LỚP BẢO VỆ (verifyToken rồi đến isAdmin) mới tới được createProduct
router.post('/', verifyToken, isAdmin, productController.createProduct);

// 2. Link lấy danh sách sản phẩm: Ai xem cũng được (user thường, khách vãng lai) nên KHÔNG CẦN CHÈN MIDDLEWARE
router.get('/', productController.getAllProducts);

module.exports = router;