const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Company = require('../models/CompanyProfile');
const JobVacancyFavorites = require('../models/JobVacancyFavorites');

// Função para criar uma empresa
exports.createCompany = async (req, res) => {
    try {
        const {
            email,
            password,
            companyName,
            positionInTheCompany,
            branchOfActivity,
            telephone,
            type,
            address,
            description,
            employeerNumber,
            employerCompanyData,
            crhCompanyData,
            liberalProfessionalData,
            site
        } = req.body;

        // Verifica se o email já está registrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Tentativa de registro com e-mail já existente: ${email}`);
            return res.status(400).json({ error: 'Email já registrado.' });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o perfil da empresa
        const companyProfile = new Company({
            email,
            password: hashedPassword,
            companyName,
            positionInTheCompany,
            branchOfActivity,
            telephone,
            type,
            address,
            description,
            employeerNumber,
            employerCompanyData,
            crhCompanyData,
            liberalProfessionalData,
            site
        });

        await companyProfile.save();
        logger.info(`Perfil de empresa criado com sucesso para o usuário: ${email}`);

        res.status(201).json({ message: 'Empresa criada com sucesso', companyProfile });
    } catch (error) {
        logger.error(`Erro ao criar empresa: ${error.message} - Dados: ${JSON.stringify(req.body)}`);
        res.status(500).json({ error: 'Erro ao criar empresa', details: error.message });
    }
};

// Função para listar todas as empresas
exports.listAllCompanies = async (req, res) => {
    try {
        // Busca todas as empresas no banco de dados
        const companies = await Company.find();

        // Retorna a lista de empresas como resposta
        res.status(200).json(companies);
    } catch (error) {
        logger.error(`Erro ao listar empresas: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar empresas', error: error.message });
    }
};

// Função para buscar uma empresa pelo ID
exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca a empresa no banco de dados pelo ID
        const company = await Company.findById(id);

        // Se a empresa não for encontrada, retorna um erro 404
        if (!company) {
            logger.warn(`Empresa com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        // Retorna a empresa encontrada como resposta
        res.status(200).json(company);
    } catch (error) {
        logger.error(`Erro ao buscar empresa pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar empresa', error: error.message });
    }
};

// Função para atualizar uma empresa pelo ID
exports.updateCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Atualiza a empresa no banco de dados pelo ID
        const updatedCompany = await Company.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        // Se a empresa não for encontrada, retorna um erro 404
        if (!updatedCompany) {
            logger.warn(`Empresa com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        logger.info(`Empresa atualizada com sucesso. ID: ${id}`);

        // Retorna a empresa atualizada como resposta
        res.status(200).json(updatedCompany);
    } catch (error) {
        logger.error(`Erro ao atualizar empresa pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar empresa', error: error.message });
    }
};

// Função para listar todos os candidatos favoritos de uma vaga de emprego para uma empresa
exports.listFavoriteJobVacancies = async (req, res) => {
    try {
        const { companyId, jobVacancyId } = req.params; 
        
        // Verifica se a empresa possui candidatos favoritos para a vaga de emprego específica
        const jobVacancyFavorites = await JobVacancyFavorites.findOne({ companyId, jobVacancyId }).populate('favoriteCandidates');

        // Se não houver favoritos, retorna um erro
        if (!jobVacancyFavorites) {
            logger.warn(`Lista de candidatos favoritos não encontrada para a vaga com ID ${jobVacancyId} e empresa com ID ${companyId}.`);
            return res.status(404).json({ message: 'Lista de candidatos favoritos não encontrada.' });
        }

        // Retorna os candidatos favoritos como resposta
        res.status(200).json(jobVacancyFavorites.favoriteCandidates);
    } catch (error) {
        logger.error(`Erro ao listar candidatos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar candidatos favoritos', error: error.message });
    }
};

// Função para adicionar um candidato aos favoritos de uma vaga de emprego para uma empresa
exports.addFavoriteCandidate = async (req, res) => {
    try {
        const { companyId, jobVacancyId, candidateId } = req.body;
        
        // Verifica se a vaga de emprego e a empresa estão associadas com candidatos favoritos
        let jobVacancyFavorites = await JobVacancyFavorites.findOne({ companyId, jobVacancyId });

        // Se não houver um documento para essa combinação, cria um novo
        if (!jobVacancyFavorites) {
            jobVacancyFavorites = new JobVacancyFavorites({
                companyId,
                jobVacancyId,
                favoriteCandidates: [candidateId]
            });
        } else {
            // Verifica se o candidato já está na lista de favoritos
            if (jobVacancyFavorites.favoriteCandidates.includes(candidateId)) {
                logger.warn(`Candidato com ID ${candidateId} já está nos favoritos para a vaga com ID ${jobVacancyId} da empresa com ID ${companyId}.`);
                return res.status(400).json({ message: 'Candidato já está nos favoritos.' });
            }

            // Adiciona o candidato aos favoritos
            jobVacancyFavorites.favoriteCandidates.push(candidateId);
        }

        // Salva as atualizações
        await jobVacancyFavorites.save();
        logger.info(`Candidato com ID ${candidateId} adicionado aos favoritos para a vaga com ID ${jobVacancyId} da empresa com ID ${companyId}.`);

        res.status(200).json({ message: 'Candidato adicionado aos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao adicionar candidato aos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao adicionar candidato aos favoritos', error: error.message });
    }
};

// Função para remover um candidato dos favoritos de uma vaga de emprego para uma empresa
exports.removeFavoriteCandidate = async (req, res) => {
    try {
        const { candidateId, companyId, jobVacancyId } = req.body; // ID do candidato, empresa e vaga no corpo da requisição

        // Verifica se a vaga de emprego e a empresa estão associadas com candidatos favoritos
        let jobVacancyFavorites = await JobVacancyFavorites.findOne({ companyId, jobVacancyId });

        // Se não houver um documento para essa combinação, retorna um erro
        if (!jobVacancyFavorites) {
            logger.warn(`Lista de candidatos favoritos não encontrada para a vaga com ID ${jobVacancyId} da empresa com ID ${companyId}.`);
            return res.status(404).json({ message: 'Lista de candidatos favoritos não encontrada.' });
        }

        // Verifica se o candidato está na lista de favoritos
        const index = jobVacancyFavorites.favoriteCandidates.indexOf(candidateId);
        if (index === -1) {
            logger.warn(`Candidato com ID ${candidateId} não está nos favoritos para a vaga com ID ${jobVacancyId} da empresa com ID ${companyId}.`);
            return res.status(400).json({ message: 'Candidato não está nos favoritos.' });
        }

        // Remove o candidato dos favoritos
        jobVacancyFavorites.favoriteCandidates.splice(index, 1);

        // Salva as atualizações
        await jobVacancyFavorites.save();
        logger.info(`Candidato com ID ${candidateId} removido dos favoritos para a vaga com ID ${jobVacancyId} da empresa com ID ${companyId}.`);

        res.status(200).json({ message: 'Candidato removido dos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao remover candidato dos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao remover candidato dos favoritos', error: error.message });
    }
};