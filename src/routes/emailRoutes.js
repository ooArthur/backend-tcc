const express = require('express');
const { requestVerificationCode, verifyCode } = require('../controllers/emailController');

const router = express.Router();

// Rota para solicitar um código de verificação
router.post('/request-code', requestVerificationCode);

// Rota para verificar um código de verificação
router.post('/verify-code', verifyCode);

module.exports = router;