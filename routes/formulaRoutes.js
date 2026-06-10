const express = require('express');
const router = express.Router();
const formulaController = require('../controllers/formulaController');

// 🔥 IMPORT ĐÚNG FILE MIDDLEWARE CỦA BẠN:
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Áp dụng verifyToken để bảo mật
router.post('/save', verifyToken, formulaController.saveFormula);
router.get('/my-formulas', verifyToken, formulaController.getMyFormulas);
module.exports = router;
