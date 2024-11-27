const User = require('../models/User');
const logger = require('../config/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Candidate = require('../models/CandidateProfile');
const Company = require('../models/CompanyProfile');
const JobVacancyFavorites = require('../models/JobVacancyFavorites');
const CandidateFavorites = require('../models/CandidateFavorites');
const JobVacancy = require('../models/JobVacancy');
const ResetToken = require('../models/ResetToken');
const { sendPasswordResetEmail } = require('./emailController');
const VerificationCode = require('../models/VerificationCode');

exports.removeUnverifiedUsers = async () => {
    try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        // Encontre todos os usuários que serão removidos
        const unverifiedUsers = await User.find({
            emailVerified: false,
            createdAt: { $lt: fifteenDaysAgo }
        });

        if (!unverifiedUsers || unverifiedUsers.length === 0) {
            logger.info('Nenhum usuário não verificado para remover.');
            return;
        }

        // Recolha todos os IDs dos usuários que serão excluídos
        const userIds = unverifiedUsers.map(user => user._id);

        // Inicie as exclusões em cascata
        await Promise.all([
            CandidateFavorites.deleteMany({ candidateId: { $in: userIds } }),
            JobApplicationStatus.deleteMany({ candidateId: { $in: userIds } }),
            JobApplicationStatus.deleteMany({ companyId: { $in: userIds } }),
            JobVacancyFavorites.deleteMany({ favoriteCandidates: { $in: userIds } }),
            JobVacancyFavorites.updateMany(
                {},
                { $pull: { favoriteCandidates: { $in: userIds } } }
            ),
            Report.deleteMany({ reportedBy: { $in: userIds } }),
            Report.deleteMany({ targetId: { $in: userIds } }),
            ResetToken.deleteMany({ userId: { $in: userIds } }),
            VerificationCode.deleteMany({ email: { $in: unverifiedUsers.map(u => u.email) } }),
            Candidate.deleteMany({ _id: { $in: userIds } }),
            Company.deleteMany({ _id: { $in: userIds } }),
        ]);

        // Exclua os usuários não verificados
        const result = await User.deleteMany({ _id: { $in: userIds } });

        logger.info(`Usuários não verificados removidos: ${result.deletedCount}`);
    } catch (error) {
        logger.error(`Erro ao remover usuários não verificados: ${error.message}`);
    }
};

exports.getUserInfo = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuário não autenticado.' });
        }

        // Buscar as informações completas do usuário
        const user = await User.findById(req.user.id).select('-password'); // Exclui a senha dos dados retornados

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        
        res.status(200).json({
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
        });
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        res.status(500).json({ message: 'Erro ao obter informações do usuário.', error: error.message });
    }
};

exports.createAdminUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verifica se o email foi fornecido
        if (!email || !password) {
            logger.warn('Email e senha são obrigatórios para criar um usuário administrador.');
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        // Verifica se o email já está em uso
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Tentativa de criar usuário com email ${email} que já está em uso.`);
            return res.status(400).json({ message: 'O email já está em uso por outro usuário.' });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o novo usuário administrador
        const newUser = new User({
            email: email,
            password: hashedPassword,
            role: 'Admin',
            emailVerified: true // Define como verdadeiro se você deseja que o e-mail esteja verificado por padrão
        });

        // Salva o novo usuário no banco de dados
        await newUser.save();

        logger.info(`Novo usuário administrador criado com sucesso. Email: ${email}`);
        res.status(201).json({ message: 'Usuário administrador criado com sucesso.', user: newUser });
    } catch (error) {
        logger.error(`Erro ao criar usuário administrador: ${error.message}`);
        res.status(500).json({ message: 'Erro ao criar usuário administrador', error: error.message });
    }
};

exports.listAllUsers = async (req, res) => {
    try {
        // Busca todos os usuários no banco de dados
        const users = await User.find();

        logger.info('Lista de todos os usuários retornada com sucesso.');
        // Retorna a lista de usuários como resposta
        res.status(200).json(users);
    } catch (error) {
        logger.error(`Erro ao listar usuários: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar usuários', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o usuário no banco de dados pelo ID
        const user = await User.findById(id);

        // Se o usuário não for encontrado, retorna um erro 404
        if (!user) {
            logger.warn(`Usuário com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        logger.info(`Usuário com ID ${id} encontrado.`);
        // Retorna o usuário encontrado como resposta
        res.status(200).json(user);
    } catch (error) {
        logger.error(`Erro ao buscar usuário pelo ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar usuário', error: error.message });
    }
};

exports.updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verifica se o e-mail está sendo atualizado
        if (updates.email) {
            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser && existingUser._id.toString() !== id) {
                logger.warn(`Tentativa inválida de atualizar o usuário com ID ${id}. Email já cadastrado.`);
                return res.status(400).json({ message: 'O email já está em uso por outro usuário.' });
            }

            // Se o email for atualizado, define emailVerified como false e envia o código de verificação
            updates.emailVerified = false;

            const code = generateCode();
            const expiresAt = new Date(Date.now() + 15 * 60000); // Expira em 15 minutos
            await VerificationCode.deleteMany({ email: updates.email }); // Remove códigos anteriores
            await VerificationCode.create({ email: updates.email, code, expiresAt });

            await sendVerificationEmail(updates.email, code);

            logger.info(`Código de verificação enviado para o novo email ${updates.email}.`);
        }

        // Criptografa a nova senha se fornecida
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        // Atualiza o usuário no banco de dados pelo ID
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!updatedUser) {
            logger.warn(`Usuário com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        logger.info(`Usuário com ID ${id} atualizado com sucesso.`);
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error(`Erro ao atualizar usuário pelo ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
    }
};

exports.deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o usuário na coleção User
        const user = await User.findById(id);
        if (!user) {
            logger.warn(`Usuário com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verifica se o usuário é um candidato
        const candidate = await Candidate.findById(id);
        if (candidate) {
            // Remove todas as vagas favoritas do candidato
            await CandidateFavorites.deleteMany({ candidateId: id });
            logger.info(`Candidato com ID ${id} e suas vagas favoritas foram excluídos com sucesso.`);
        }

        // Verifica se o usuário é uma empresa
        const company = await Company.findById(id);
        if (company) {
            // Remove todas as vagas da empresa
            await JobVacancy.deleteMany({ companyId: id });

            // Remove todos os candidatos favoritos associados às vagas da empresa
            await JobVacancyFavorites.deleteMany({ companyId: id });

            logger.info(`Empresa com ID ${id}, suas vagas e candidatos favoritos foram excluídos com sucesso.`);
        }

        // Exclui o usuário da coleção User
        await User.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Usuário e seus dados associados excluídos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir usuário pelo ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir usuário', error: error.message });
    }
};

// Solicitar Redefinição de Senha
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn(`Tentativa de solicitação de redefinição de senha para um e-mail não registrado: ${email}`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Remove códigos anteriores não utilizados
        await ResetToken.deleteMany({ userId: user._id, isVerified: false });

        // Gera um novo token de redefinição de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);
        const expiresAt = new Date(Date.now() + 3600000); // Expira em 1 hora

        // Salva o novo token no banco de dados
        const tokenRecord = new ResetToken({
            userId: user._id,
            token: hashedToken,
            expiresAt,
            isVerified: false
        });

        await tokenRecord.save();

        // Envia o e-mail com o link de redefinição de senha
        const resetLink = `${process.env.CORS_ORIGIN}/reset-password?token=${hashedToken}`;
        await sendPasswordResetEmail(user.email, resetLink);

        logger.info(`Token de redefinição de senha enviado para o e-mail ${email}`);
        res.status(200).json({ message: 'Instruções para redefinição de senha foram enviadas para o seu e-mail.' });
    } catch (error) {
        logger.error(`Erro ao solicitar redefinição de senha para o e-mail ${email}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao solicitar redefinição de senha.', error: error.message });
    }
};

// Redefinir Senha
exports.resetPassword = async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    try {
        // Busca o token fornecido
        const tokenRecord = await ResetToken.findOne({ token });

        if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
            logger.warn('Token inválido ou expirado para redefinição de senha.');
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        const user = await User.findById(tokenRecord.userId);

        if (!user) {
            logger.warn('Usuário não encontrado para o token fornecido.');
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Criptografa a nova senha
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        // Remove o token após a utilização
        await ResetToken.deleteOne({ _id: tokenRecord._id });

        logger.info(`Senha redefinida com sucesso para o usuário ${user.email}`);
        res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao redefinir senha: ${error.message}`);
        res.status(500).json({ message: 'Erro ao redefinir senha.', error: error.message });
    }
};

exports.cleanupExpiredCode = async () =>{
    try {
        // Remove códigos que expiraram e ainda não foram verificados
        const result = await VerificationCode.deleteMany({
            expiresAt: { $lt: new Date() },
            isVerified: false
        });

        logger.info(`Códigos de verificação expirados removidos: ${result.deletedCount}`);
    } catch (error) {
        logger.error(`Erro ao remover códigos de verificação expirados: ${error.message}`);
    }
}

// Função para remover tokens de redefinição de senha expirados
exports.cleanupExpiredTokens = async () => {
    try {
        // Remove tokens que expiraram e ainda não foram utilizados
        const result = await ResetToken.deleteMany({
            expiresAt: { $lt: new Date() },
            isVerified: false
        });

        logger.info(`Tokens expirados removidos: ${result.deletedCount}`);
    } catch (error) {
        logger.error(`Erro ao remover tokens expirados: ${error.message}`);
    }
};