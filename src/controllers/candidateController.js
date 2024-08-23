const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Candidate = require('../models/CandidateProfile');

// Função para criar um novo candidato
exports.createCandidate = async (req, res) => {
    try {
        const {
            email,
            password,
            candidateName,
            candidatePhone,
            desiredRole,
            candidateTargetSalary,
            desiredState,
            desiredCity,
            candidateCEP,
            candidateAddress,
            candidateComplement,
            candidateBirth,
            candidateGender,
            candidateCivilStatus,
            candidateLastJob,
            candidateHierarchicalArea,
            candidateIdioms,
            candidateCourses,
            candidateExperience,
            candidateQualifications
        } = req.body;

        // Verifica se o email já está registrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Tentativa de registro com e-mail já existente: ${email}`);
            return res.status(400).json({ error: 'Email já registrado.' });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o perfil do candidato
        const candidateProfile = new Candidate({
            email,
            password: hashedPassword,
            candidateName,
            candidatePhone,
            desiredRole,
            candidateTargetSalary,
            desiredState,
            desiredCity,
            candidateCEP,
            candidateAddress,
            candidateComplement,
            candidateBirth,
            candidateGender,
            candidateCivilStatus,
            candidateLastJob,
            candidateHierarchicalArea,
            candidateIdioms,
            candidateCourses,
            candidateExperience,
            candidateQualifications
        });

        await candidateProfile.save();
        logger.info(`Perfil de candidato criado com sucesso para o usuário: ${email}`);

        res.status(201).json({ message: 'Candidato criado com sucesso', candidateProfile });
    } catch (error) {
        logger.error(`Erro ao criar candidato: ${error.message}`);
        res.status(500).json({ error: 'Erro ao criar candidato', details: error.message });
    }
};

// Função para listar todos os candidatos
exports.listAllCandidates = async (req, res) => {
    try {
        // Busca todos os candidatos no banco de dados
        const candidates = await Candidate.find();
        logger.info(`Lista de todos os candidatos retornada com sucesso.`);
        
        // Retorna a lista de candidatos como resposta
        res.status(200).json(candidates);
    } catch (error) {
        logger.error(`Erro ao listar candidatos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar candidatos', error: error.message });
    }
};

// Função para buscar um candidato pelo ID
exports.getCandidateById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o candidato no banco de dados pelo ID
        const candidate = await Candidate.findById(id);

        // Se o candidato não for encontrado, retorna um erro 404
        if (!candidate) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        logger.info(`Candidato com ID ${id} encontrado e retornado.`);
        
        // Retorna o candidato encontrado como resposta
        res.status(200).json(candidate);
    } catch (error) {
        logger.error(`Erro ao buscar candidato pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar candidato', error: error.message });
    }
};

// Função para atualizar um candidato pelo ID
exports.updateCandidateById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Atualiza o candidato no banco de dados pelo ID
        const updatedCandidate = await Candidate.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        // Se o candidato não for encontrado, retorna um erro 404
        if (!updatedCandidate) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        logger.info(`Candidato com ID ${id} atualizado com sucesso.`);
        
        // Retorna o candidato atualizado como resposta
        res.status(200).json(updatedCandidate);
    } catch (error) {
        logger.error(`Erro ao atualizar candidato pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar candidato', error: error.message });
    }
};

// Função para deletar um candidato pelo ID
exports.deleteCandidateById = async (req, res) => {
    try {
        const { id } = req.params;

        // Remove o candidato do banco de dados pelo ID
        const result = await Candidate.findByIdAndDelete(id);

        // Se o candidato não for encontrado, retorna um erro 404
        if (!result) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        logger.info(`Candidato com ID ${id} excluído com sucesso.`);
        
        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: 'Candidato excluído com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir candidato pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir candidato', error: error.message });
    }
};