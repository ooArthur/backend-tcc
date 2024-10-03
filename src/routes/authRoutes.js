const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();
const { validateRefreshToken } = require('../middleware/validateRefreshToken');

// Rota de login
router.post('/login', authController.login);

// Rota para renovar o token de acesso
router.post('/refresh-token',
    validateRefreshToken,
    authController.refreshToken
);

// Rota de logout
router.post('/logout', authController.logout);

module.exports = router;