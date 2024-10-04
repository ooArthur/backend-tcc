const logger = require('../config/logger');

// Middleware para autorizar múltiplos papéis
exports.authorizeRoles = (...permittedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.warn('Usuário não autenticado.');
            return res.status(401).json({ message: 'Autenticação necessária.' });
        }

        // Verifica se o papel do usuário está entre os permitidos
        if (!permittedRoles.includes(req.user.role)) {
            logger.warn(`Acesso negado para o usuário com ID ${req.user.id} e função ${req.user.role}`);
            return res.status(403).json({ message: `Acesso negado. É necessário ter um dos papéis: ${permittedRoles.join(', ')}` });
        }

        next(); // Passa para o próximo middleware se o usuário tiver uma função permitida
    };
};