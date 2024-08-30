const logger = require('../config/logger');

// Middleware para garantir que o usuário é um administrador
exports.authorizeAdmin = (req, res, next) => {
    // Verifica se o usuário está autenticado
    if (!req.user) {
        logger.warn('Usuário não autenticado.');
        return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    // Verifica se o papel do usuário é 'admin'
    if (req.user.role !== 'admin') {
        logger.warn(`Acesso negado para o usuário com ID ${req.user.id} e função ${req.user.role}`);
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores têm permissão para acessar esta rota.' });
    }

    next(); // Passa para o próximo middleware se o usuário for um administrador
};