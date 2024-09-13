const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Caminho para o modelo de usuário

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para autenticar o token de acesso
exports.authenticateToken = async (req, res, next) => {
    // Obtenha o token do cabeçalho da requisição
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acesso não fornecido.' });
    }

    try {
        // Verifica se o token de acesso é válido
        const decoded = jwt.verify(token, JWT_SECRET);

        // Busca o usuário pelo ID contido no token
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        // Adiciona o usuário à requisição
        req.user = user;

        // Continua para o próximo middleware ou rota
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token de acesso inválido ou expirado.', error: error.message });
    }
};