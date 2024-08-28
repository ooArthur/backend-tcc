const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Configurações para o JWT
const JWT_SECRET = process.env.JWT_SECRET; 

// Middleware de autenticação
exports.authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Obtém o token após "Bearer"

    if (!token) {
        logger.warn('Token de autenticação não fornecido.');
        return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verifica o token
        req.user = decoded; // Adiciona as informações do usuário ao objeto req
        next(); // Passa para o próximo middleware
    } catch (error) {
        logger.error(`Erro ao verificar o token: ${error.message}`);
        return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
};