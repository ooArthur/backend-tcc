const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // Pacote UUID para gerar IDs únicos
const logger = require('../config/logger');
const User = require('../models/User');

// Configurações para o JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRATION = '7d';

// Função para gerar tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, type: user.type, uuid: user.refreshTokenId }, // Inclui o UUID no token de acesso
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
        { id: user._id, type: user.type, uuid: user.refreshTokenId }, // Inclui o UUID no token de atualização
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    return { accessToken, refreshToken };
};

// Função de login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            logger.warn(`Tentativa de login com e-mail não registrado: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn(`Tentativa de login com senha incorreta para o e-mail: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gera um UUID único para o refreshToken
        const refreshTokenId = uuidv4();
        user.refreshTokenId = refreshTokenId;

        const { accessToken, refreshToken } = generateTokens(user);

        // Armazena o token de refresh e o UUID gerado no banco de dados
        user.refreshToken = refreshToken;
        await user.save();

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
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Busca o usuário com o token e UUID correspondentes
        const user = await User.findOne({ _id: decoded.id, refreshToken });
        if (!user || user.refreshTokenId !== decoded.uuid) {
            logger.warn(`Usuário não encontrado ou token de atualização inválido.`);
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Gera um novo token de acesso e refresh token
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Gera um novo UUID para o novo refresh token
        user.refreshToken = newRefreshToken;
        user.refreshTokenId = uuidv4();
        await user.save();

        logger.info(`Token de acesso renovado para o usuário: ${user.email}`);
        res.status(200).json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        logger.error(`Erro ao renovar token: ${error.message}`);
        res.status(403).json({ error: 'Token de atualização inválido ou expirado', details: error.message });
    }
};

// Função de logout para invalidar tokens
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Token de atualização é necessário para logout' });
        }

        const user = await User.findOneAndUpdate({ refreshToken }, { refreshToken: null, refreshTokenId: null });
        if (!user) {
            logger.warn('Token de atualização não encontrado durante logout.');
            return res.status(401).json({ error: 'Token de atualização inválido' });
        }

        logger.info(`Usuário com e-mail ${user.email} deslogado com sucesso.`);
        res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        logger.error(`Erro ao fazer logout: ${error.message}`);
        res.status(500).json({ error: 'Erro ao fazer logout', details: error.message });
    }
};