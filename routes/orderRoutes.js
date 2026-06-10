const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
// Đường link đặt hàng: POST /api/orders

router.post('/', verifyToken, orderController.createOrder);
router.get('/user/:userId', orderController.getUserOrders);
router.get('/all', verifyToken, orderController.getAllOrders);
module.exports = router;