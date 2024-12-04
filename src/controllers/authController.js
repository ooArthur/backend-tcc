const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

// Configurações para o JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '1m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRATION = '7d';

// Função para gerar tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
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
            return res.status(401).json({ error: 'Verifique se o e-mail está correto e tente novamente.' });
        }

        // Verifica se o usuário está banido
        if (user.banned) {
            logger.warn(`Tentativa de login de um usuário banido: ${email}`);
            return res.status(403).json({ error: 'Usuário banido. Entre em contato com o suporte.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn(`Tentativa de login com senha incorreta para o e-mail: ${email} e a senha correta é: ${password}  ${user.password}`);
            return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;

        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            domain: process.env.NODE_ENV === 'production' ? '.joblinkbr.com' : undefined,
        });

        logger.info(`Usuário autenticado com sucesso: ${email}`);
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`Erro ao fazer login: ${error.message}`);
        res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
    }
};

// Função para renovar o token de acesso
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é necessário' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            logger.warn('Usuário não encontrado.');
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        // Verifica se o usuário está banido
        if (user.banned) {
            logger.warn(`Tentativa de renovação de token de um usuário banido: ${user.email}`);
            return res.status(403).json({ error: 'Usuário banido' });
        }

        // Verifica se o refreshToken do usuário na base de dados corresponde ao que foi recebido
        if (user.refreshToken !== refreshToken) {
            logger.warn('Token de atualização inválido para o usuário.');
            return res.status(401).json({ error: 'Token inválido' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        user.refreshToken = newRefreshToken; // Atualiza o refresh token

        await user.save();

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true, // Para evitar acesso via JavaScript no navegador
            secure: process.env.NODE_ENV === 'production', // Somente HTTPS em produção
            sameSite: 'Strict', // Restringe envio de cookies ao mesmo domínio
            domain: process.env.NODE_ENV === 'production' ? '.joblinkbr.com' : undefined,
        });

        logger.info(`Token de acesso renovado para o usuário: ${user.email}`);
        res.status(200).json({ accessToken });
    } catch (error) {
        logger.error(`Erro ao renovar token: ${error.message}`);
        res.status(403).json({ error: 'Token de atualização inválido ou expirado', details: error.message });
    }
};

// Função de logout
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Token de atualização é necessário para logout' });
        }

        const user = await User.findOne({ refreshToken });

        if (!user) {
            logger.warn('Token de atualização não encontrado durante logout.');
            // Mesmo que o *refresh token* não seja encontrado, você pode ainda limpar o cookie:
            res.clearCookie('refreshToken', {
                httpOnly: true, // Para evitar acesso via JavaScript no navegador
                secure: process.env.NODE_ENV === 'production', // Somente HTTPS em produção
                sameSite: 'Strict', // Restringe envio de cookies ao mesmo domínio
                domain: process.env.NODE_ENV === 'production' ? '.joblinkbr.com' : undefined,
            });
            return res.status(401).json({ error: 'Token de atualização inválido ou não encontrado' });
        }

        // Invalida o refreshTken do usuário
        user.refreshToken = null;

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        await user.save();

        logger.info(`Usuário com e-mail ${user.email} deslogado com sucesso.`);
        res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        logger.error(`Erro ao fazer logout: ${error.message}`);
        res.status(500).json({ error: 'Erro ao fazer logout', details: error.message });
    }
};