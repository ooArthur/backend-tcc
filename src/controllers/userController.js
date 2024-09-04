const User = require('../models/User');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');
const Candidate = require('../models/CandidateProfile');
const Company = require('../models/CompanyProfile');
const JobVacancyFavorites = require('../models/JobVacancyFavorites');
const CandidateFavorites = require('../models/CandidateFavorites');
const JobVacancy = require('../models/JobVacancy');

// Função para remover usuários com email não verificado após 15 dias
exports.removeUnverifiedUsers = async () => {
    try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        // Remove todos os usuários que não verificaram o email e que foram criados há mais de 15 dias
        const result = await User.deleteMany({
            emailVerified: false,
            createdAt: { $lt: fifteenDaysAgo }
        });

        logger.info(`Usuários não verificados removidos: ${result.deletedCount}`);
    } catch (error) {
        logger.error(`Erro ao remover usuários não verificados: ${error.message}`);
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
            role: 'admin',
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

        // Verifica se o email está sendo atualizado
        if (updates.email) {
            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser && existingUser._id.toString() !== id) {
                logger.warn(`Tentativa inválida de atualizar o usuário com ID ${id}. Email já cadastrado.`);
                return res.status(400).json({ message: 'O email já está em uso por outro usuário.' });
            }

            // Se o email for atualizado, define isEmailVerified como false
            updates.isEmailVerified = false;
            logger.info(`Usuário com ID ${id}: O email foi alterado para ${updates.email}. O campo isEmailVerified será definido como false.`);
        }
        // Criptografa a nova senha se fornecida
        if (updates.password) {
            logger.info(`Criptografando senha para o usuário com ID ${id}.`);
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        // Atualiza o usuário no banco de dados pelo ID
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        // Se o usuário não for encontrado, retorna um erro 404
        if (!updatedUser) {
            logger.warn(`Usuário com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        logger.info(`Usuário com ID ${id} atualizado com sucesso.`);
        // Retorna o usuário atualizado como resposta
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