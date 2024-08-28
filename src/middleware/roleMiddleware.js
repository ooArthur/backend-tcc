const logger = require('../config/logger');

// Middleware de autorização
exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        // Verifica se o usuário está autenticado
        if (!req.user) {
            logger.warn('Usuário não autenticado.');
            return res.status(401).json({ message: 'Autenticação necessária.' });
        }

        // Verifica se o papel do usuário está na lista de permissões
        if (!roles.includes(req.user.role)) {
            logger.warn(`Acesso negado para o usuário com ID ${req.user.id} e função ${req.user.role}`);
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        next(); // Passa para o próximo middleware se a autorização for bem-sucedida
    };
};