const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.validateRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        logger.warn('Refresh token é necessário.');
        return res.status(400).json({ error: 'Refresh token é necessário' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Busca o usuário pelo ID decodificado
        const user = await User.findById(decoded.id);

        if (!user) {
            logger.warn('Usuário não encontrado.');
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        // Verifica se o refreshToken do usuário na base de dados corresponde ao que foi recebido
        if (user.refreshToken !== refreshToken) {
            logger.warn('Token de atualização inválido para o usuário.');
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Anexa o usuário ao request para uso posterior
        req.user = user;
        next();
    } catch (error) {
        logger.error(`Erro ao validar token de atualização: ${error.message}`);
        return res.status(403).json({ error: 'Token de atualização inválido ou expirado', details: error.message });
    }
};