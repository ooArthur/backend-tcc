const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Candidate = require('../models/CandidateProfile');
const CandidateFavorites = require('../models/CandidateFavorites');
const JobVacancy = require('../models/JobVacancy');

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
            candidateQualifications,
            candidateAbout,
            candidateLink,
            areaOfInterest
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
            candidateQualifications,
            candidateAbout,
            candidateLink,
            areaOfInterest
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
        const id = req.user.id;

        // Busca o candidato no banco de dados pelo ID
        const candidate = await Candidate.findById(id);

        // Se o candidato não for encontrado, retorna um erro 404
        if (!candidate) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

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
        const id = req.user.id;
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

// Função para listar todas as vagas favoritas de um candidato
exports.listFavoriteJobVacancies = async (req, res) => {
    try {
        const candidateId = req.user.id;  // Obtemos o ID do candidato dos parâmetros da URL

        // Verifica se o candidato possui uma lista de favoritos
        const candidateFavorites = await CandidateFavorites.findOne({ candidateId }).populate('favoriteJobVacancies');

        // Se o candidato não tiver uma lista de favoritos, retorna um erro
        if (!candidateFavorites) {
            return res.status(404).json({ message: 'Lista de favoritos não encontrada para o candidato.' });
        }

        // Retorna as vagas favoritas como resposta
        res.status(200).json(candidateFavorites.favoriteJobVacancies);
    } catch (error) {
        logger.error(`Erro ao listar vagas favoritas: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar vagas favoritas', error: error.message });
    }
};

// Função para adicionar uma vaga aos favoritos de um candidato
exports.addFavoriteJobVacancy = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { jobVacancyId } = req.body;

        // Verifica se a vaga de emprego existe
        const jobVacancy = await JobVacancy.findById(jobVacancyId);
        if (!jobVacancy) {
            logger.warn(`Vaga de emprego com ID ${jobVacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Vaga de emprego não encontrada.' });
        }

        // Verifica se o candidato já possui uma lista de favoritos
        let candidateFavorites = await CandidateFavorites.findOne({ candidateId });

        // Se o candidato ainda não tem uma lista de favoritos, cria uma nova
        if (!candidateFavorites) {
            candidateFavorites = new CandidateFavorites({
                candidateId,
                favoriteJobVacancies: [jobVacancyId],
            });
        } else {
            // Verifica se a vaga já está nos favoritos
            if (candidateFavorites.favoriteJobVacancies.includes(jobVacancyId)) {
                logger.warn(`Vaga de emprego com ID ${jobVacancyId} já está nos favoritos do candidato.`);
                return res.status(400).json({ message: 'Vaga de emprego já está nos favoritos.' });
            }

            // Adiciona a vaga aos favoritos do candidato
            candidateFavorites.favoriteJobVacancies.push(jobVacancyId);
        }

        // Salva as atualizações
        await candidateFavorites.save();
        logger.info(`Vaga de emprego com ID ${jobVacancyId} adicionada aos favoritos do candidato com ID ${candidateId}.`);

        res.status(200).json({ message: 'Vaga de emprego adicionada aos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao adicionar vaga de emprego aos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao adicionar vaga de emprego aos favoritos', error: error.message });
    }
};

// Função para remover uma vaga dos favoritos de um candidato
exports.removeFavoriteJobVacancy = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { jobVacancyId } = req.body;

        // Verifica se o candidato possui uma lista de favoritos
        let candidateFavorites = await CandidateFavorites.findOne({ candidateId });

        // Se o candidato não tiver uma lista de favoritos, retorna um erro
        if (!candidateFavorites) {
            logger.warn(`Lista de favoritos não encontrada para o candidato com ID ${candidateId}.`);
            return res.status(404).json({ message: 'Lista de favoritos não encontrada para o candidato.' });
        }

        // Verifica se a vaga está nos favoritos
        const index = candidateFavorites.favoriteJobVacancies.indexOf(jobVacancyId);
        if (index === -1) {
            logger.warn(`Vaga de emprego com ID ${jobVacancyId} não está nos favoritos do candidato com ID ${candidateId}.`);
            return res.status(400).json({ message: 'Vaga de emprego não está nos favoritos.' });
        }

        // Remove a vaga dos favoritos do candidato
        candidateFavorites.favoriteJobVacancies.splice(index, 1);

        // Salva as atualizações
        await candidateFavorites.save();
        logger.info(`Vaga de emprego com ID ${jobVacancyId} removida dos favoritos do candidato com ID ${candidateId}.`);

        res.status(200).json({ message: 'Vaga de emprego removida dos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao remover vaga de emprego dos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao remover vaga de emprego dos favoritos', error: error.message });
    }
};