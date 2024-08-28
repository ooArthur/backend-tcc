const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');
const Company = require('../models/CompanyProfile');

// Configurações para o JWT
const JWT_SECRET = process.env.JWT_SECRET; // Utilize uma variável de ambiente para o segredo
const JWT_EXPIRATION = '15m'; // Tempo de expiração do token de acesso
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; // Segredo para refresh tokens
const JWT_REFRESH_EXPIRATION = '7d'; // Tempo de expiração do refresh token

// Função para gerar tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, type: user.type },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
        { id: user._id, type: user.type },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    return { accessToken, refreshToken };
};

// Função de login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca o usuário pelo email
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn(`Tentativa de login com e-mail não registrado: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verifica a senha
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn(`Tentativa de login com senha incorreta para o e-mail: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gera os tokens de acesso e refresh
        const { accessToken, refreshToken } = generateTokens(user);

        // Retorna os tokens como resposta
        logger.info(`Usuário autenticado com sucesso: ${email}`);
        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        logger.error(`Erro ao fazer login: ${error.message}`);
        res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
    }
};

// Função para renovar o token de acesso
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é necessário' });
    }

    try {
        // Verifica e decodifica o refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Busca o usuário no banco de dados
        const user = await User.findById(decoded.id);
        if (!user) {
            logger.warn(`Usuário não encontrado para o token de atualização.`);
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Gera um novo token de acesso
        const { accessToken } = generateTokens(user);

        logger.info(`Token de acesso renovado para o usuário: ${user.email}`);
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`Erro ao renovar token: ${error.message}`);
        res.status(403).json({ error: 'Token de atualização inválido ou expirado', details: error.message });
    }
};

// Função de logout (opcional) para invalidar tokens
exports.logout = async (req, res) => {
    try {
        // Aqui você pode adicionar a lógica de blacklist ou invalidar tokens em armazenamento
        logger.info(`Usuário deslogado com sucesso.`);
        res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        logger.error(`Erro ao fazer logout: ${error.message}`);
        res.status(500).json({ error: 'Erro ao fazer logout', details: error.message });
    }
};