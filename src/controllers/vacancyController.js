const JobVacancy = require('../models/JobVacancy');
const Company = require('../models/CompanyProfile');
const Candidate = require('../models/CandidateProfile');
const logger = require('../config/logger');

// Função para remover vagas antigas
exports.removeOldJobVacancies = async () => {
    try {
        // Define o prazo de 3 meses atrás
        const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);

        // Remove todas as vagas que foram criadas há mais de 3 meses
        const result = await JobVacancy.deleteMany({
            createdAt: { $lt: threeMonthsAgo }
        });

        logger.info(`Vagas removidas: ${result.deletedCount}`);
    } catch (error) {
        logger.error(`Erro ao remover vagas antigas: ${error.message}`);
    }
};

// Função Criar Vagas
exports.createJobVacancy = async (req, res) => {
    try {
        const {
            jobTitle,
            jobDescription,
            salary,
            jobLocation,
            workSchedule,
            requiredQualifications,
            desiredSkills,
            employmentType,
            applicationDeadline,
            companyId
        } = req.body;

        // Buscar a empresa pelo ID
        const company = await Company.findById(companyId);
        if (!company) {
            logger.error(`Empresa com ID ${companyId} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        // Criando a nova vaga
        const newJobVacancy = new JobVacancy({
            companyId,
            jobTitle,
            jobDescription,
            salary,
            jobLocation,
            workSchedule,
            requiredQualifications,
            desiredSkills,
            employmentType,
            applicationDeadline
        });

        // Salvando no banco de dados
        const savedJobVacancy = await newJobVacancy.save();
        
        logger.info(`Vaga de emprego criada com sucesso: "${jobTitle}" pela empresa: ${company.companyName} (ID: ${companyId})`);

        // Retornando a resposta com o status 201 (Criado) e a vaga criada
        res.status(201).json(savedJobVacancy);
    } catch (error) {
        logger.error(`Erro ao criar a vaga de emprego: ${error.message} - Empresa ID: ${req.body.companyId}`);
        res.status(500).json({ message: 'Erro ao criar a vaga de emprego', error: error.message });
    }
};

// Função para listar todas as vagas
exports.listAllJobVacancies = async (req, res) => {
    try {
        // Busca todas as vagas no banco de dados
        const jobVacancies = await JobVacancy.find().populate('companyId', 'companyName');

        logger.info(`Lista de vagas de emprego retornada com sucesso. Total de vagas: ${jobVacancies.length}`);

        // Retorna a lista de vagas como resposta
        res.status(200).json(jobVacancies);
    } catch (error) {
        logger.error(`Erro ao listar vagas de emprego: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar vagas de emprego', error: error.message });
    }
};

// Função para buscar uma vaga pelo ID
exports.getJobVacancyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca a vaga no banco de dados pelo ID
        const jobVacancy = await JobVacancy.findById(id).populate('companyId', 'companyName');

        // Se a vaga não for encontrada, retorna um erro 404
        if (!jobVacancy) {
            logger.warn(`Vaga com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }

        logger.info(`Vaga encontrada com sucesso. ID: ${id}`);

        // Retorna a vaga encontrada como resposta
        res.status(200).json(jobVacancy);
    } catch (error) {
        logger.error(`Erro ao buscar vaga pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar vaga', error: error.message });
    }
};

// Função de deletar vaga
exports.deleteJobVacancyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Remove a vaga do banco de dados pelo ID
        const result = await JobVacancy.findByIdAndDelete(id);

        // Se a vaga não for encontrada, retorna um erro 404
        if (!result) {
            logger.warn(`Vaga com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }

        logger.info(`Vaga excluída com sucesso. ID: ${id}`);

        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: 'Vaga excluída com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir vaga pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir vaga', error: error.message });
    }
};

// Função de atualizar vaga
exports.updateJobVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Atualiza a vaga no banco de dados pelo ID
        const updatedJobVacancy = await JobVacancy.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('companyId', 'companyName');

        // Se a vaga não for encontrada, retorna um erro 404
        if (!updatedJobVacancy) {
            logger.warn(`Vaga com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }

        logger.info(`Vaga atualizada com sucesso. ID: ${id}`);

        // Retorna a vaga atualizada como resposta
        res.status(200).json(updatedJobVacancy);
    } catch (error) {
        logger.error(`Erro ao atualizar vaga pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar vaga', error: error.message });
    }
};

// Função para listar todos os candidatos interessados em uma vaga
exports.listInterestedCandidates = async (req, res) => {
    try {
        const { jobVacancyId } = req.params; // ID da vaga na URL

        // Verifica se a vaga de emprego existe
        const jobVacancy = await JobVacancy.findById(jobVacancyId).populate('interestedCandidates');
        if (!jobVacancy) {
            logger.warn(`Vaga de emprego com ID ${jobVacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Vaga de emprego não encontrada.' });
        }

        // Retorna a lista de candidatos interessados como resposta
        res.status(200).json(jobVacancy.interestedCandidates);
    } catch (error) {
        logger.error(`Erro ao listar candidatos interessados: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar candidatos interessados', error: error.message });
    }
};

// Função para adicionar um candidato interessado em uma vaga
exports.addInterestedCandidate = async (req, res) => {
    try {
        const { candidateId, jobVacancyId } = req.body;  // ID do candidato e da vaga no corpo da requisição

        // Verifica se a vaga de emprego existe
        const jobVacancy = await JobVacancy.findById(jobVacancyId);
        if (!jobVacancy) {
            logger.warn(`Vaga de emprego com ID ${jobVacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Vaga de emprego não encontrada.' });
        }

        // Verifica se o candidato existe
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            logger.warn(`Candidato com ID ${candidateId} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Verifica se o candidato já está na lista de interessados
        if (jobVacancy.interestedCandidates.includes(candidateId)) {
            logger.warn(`Candidato com ID ${candidateId} já está na lista de interessados para a vaga com ID ${jobVacancyId}.`);
            return res.status(400).json({ message: 'Candidato já está na lista de interessados.' });
        }

        // Adiciona o candidato à lista de interessados
        jobVacancy.interestedCandidates.push(candidateId);

        // Salva as atualizações
        await jobVacancy.save();
        logger.info(`Candidato com ID ${candidateId} adicionado à vaga com ID ${jobVacancyId}.`);

        res.status(200).json({ message: 'Candidato adicionado à vaga com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao adicionar candidato à vaga: ${error.message}`);
        res.status(500).json({ message: 'Erro ao adicionar candidato à vaga', error: error.message });
    }
};

// Função para remover um candidato interessado de uma vaga
exports.removeInterestedCandidate = async (req, res) => {
    try {
        const { jobVacancyId } = req.params; // ID da vaga na URL
        const { candidateId } = req.body;  // ID do candidato no corpo da requisição

        // Verifica se a vaga de emprego existe
        const jobVacancy = await JobVacancy.findById(jobVacancyId);
        if (!jobVacancy) {
            logger.warn(`Vaga de emprego com ID ${jobVacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Vaga de emprego não encontrada.' });
        }

        // Verifica se o candidato existe
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            logger.warn(`Candidato com ID ${candidateId} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Verifica se o candidato está na lista de interessados
        const index = jobVacancy.interestedCandidates.indexOf(candidateId);
        if (index === -1) {
            logger.warn(`Candidato com ID ${candidateId} não está na lista de interessados para a vaga com ID ${jobVacancyId}.`);
            return res.status(400).json({ message: 'Candidato não está na lista de interessados.' });
        }

        // Remove o candidato da lista de interessados
        jobVacancy.interestedCandidates.splice(index, 1);

        // Salva as atualizações
        await jobVacancy.save();
        logger.info(`Candidato com ID ${candidateId} removido da vaga com ID ${jobVacancyId}.`);

        res.status(200).json({ message: 'Candidato removido da vaga com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao remover candidato da vaga: ${error.message}`);
        res.status(500).json({ message: 'Erro ao remover candidato da vaga', error: error.message });
    }
};

