const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const validateRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é necessário' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Busca o usuário com o ID e token de refresh
        const user = await User.findOne({ _id: decoded.id, refreshToken });

        if (!user || user.refreshToken !== refreshToken) {
            console.log("refreshToken 1:", user.refreshToken)
            console.log("refreshToken 2:", refreshToken)
            logger.warn(`Usuário não encontrado ou token de atualização inválido.`);
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Anexa o usuário ao request para uso posterior
        req.user = user;
        next();
    } catch (error) {
        logger.error(`Erro ao validar token de atualização: ${error.message}`);
        res.status(403).json({ error: 'Token de atualização inválido ou expirado', details: error.message });
    }
};

module.exports = {
    validateRefreshToken
};