const User = require('../models/User');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');

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

exports.deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Remove o usuário do banco de dados pelo ID
        const result = await User.findByIdAndDelete(id);

        // Se o usuário não for encontrado, retorna um erro 404
        if (!result) {
            logger.warn(`Usuário com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        logger.info(`Usuário com ID ${id} excluído com sucesso.`);
        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir usuário pelo ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir usuário', error: error.message });
    }
};

exports.updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verifica se o email está sendo atualizado e, se sim, se o novo email já está em uso
        if (updates.email) {
            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser && existingUser._id.toString() !== id) {
                logger.warn(`Tentativa inválida de atualizar o usuário com ID ${id}. Email já cadastrado.`);
                return res.status(400).json({ message: 'O email já está em uso por outro usuário.' });
            }
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