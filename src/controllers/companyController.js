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

        if (!email || !password || !companyName || !telephone || !type || !address) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
        }

        const telephoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
        if (!telephoneRegex.test(telephone)) {
            return res.status(400).json({ error: 'O telefone da empresa deve seguir o formato (XX) XXXXX-XXXX.' });
        }

        const cepRegex = /^\d{8}$/;
        if (!address.cep || !cepRegex.test(address.cep)) {
            return res.status(400).json({ error: 'O CEP deve conter exatamente 8 números (exemplo: 06160180).' });
        }

        if (type === 'Empresa Empregadora') {
            const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
            if (!employerCompanyData?.cnpj || !cnpjRegex.test(employerCompanyData.cnpj)) {
                return res.status(400).json({ error: 'CNPJ inválido para Empresa Empregadora. Formato: 12.345.678/0001-90.' });
            }
        } else if (type === 'Empresa de CRH') {
            const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
            if (!crhCompanyData?.cnpj || !cnpjRegex.test(crhCompanyData.cnpj)) {
                return res.status(400).json({ error: 'CNPJ inválido para Empresa de CRH. Formato: 12.345.678/0001-90.' });
            }
        } else if (type === 'Profissional Liberal') {
            const rgRegex = /^\d{2}\.\d{3}\.\d{3}-\d{1}$/;
            const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
            if (!liberalProfessionalData?.registrationDocument || !rgRegex.test(liberalProfessionalData.registrationDocument)) {
                return res.status(400).json({ error: 'RG inválido para Profissional Liberal. Formato: 11.111.111-1.' });
            }
            if (!liberalProfessionalData?.cpf || !cpfRegex.test(liberalProfessionalData.cpf)) {
                return res.status(400).json({ error: 'CPF inválido para Profissional Liberal. Formato: 111.111.111-11.' });
            }
        } else {
            return res.status(400).json({ error: 'Tipo de empresa inválido.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email já registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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
        res.status(201).json({ message: 'Empresa criada com sucesso, CEP: ' + address.cep, companyProfile });
    } catch (error) {
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
        const id = req.user.id;

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
exports.getCompanyById2 = async (req, res) => {
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
        let updates = { ...req.body };

        // Verifica se o campo password foi incluído nas atualizações
        if (updates.password) {
            // Encripta a nova senha antes de salvar
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            updates.password = hashedPassword;
        }

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

// Função para listar todos os candidatos favoritos gerais ou por vaga específica
exports.listFavoriteCandidates = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { jobVacancyId } = req.body;

        const query = { companyId };
        if (jobVacancyId) query.jobVacancyId = jobVacancyId; // Filtra por vaga se o ID for fornecido
        else query.jobVacancyId = null; // Caso contrário, busca favoritos gerais

        const jobVacancyFavorites = await JobVacancyFavorites.findOne(query).populate('favoriteCandidates');

        if (!jobVacancyFavorites) {
            logger.warn(`Nenhum candidato favorito encontrado para ${jobVacancyId ? `a vaga com ID ${jobVacancyId}` : 'favoritos gerais'} da empresa ${companyId}.`);
            return res.status(404).json({ message: 'Nenhum candidato favorito encontrado.' });
        }

        res.status(200).json(jobVacancyFavorites.favoriteCandidates);
    } catch (error) {
        logger.error(`Erro ao listar candidatos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar candidatos favoritos', error: error.message });
    }
};

// Função para adicionar um candidato aos favoritos gerais ou por vaga específica
exports.addFavoriteCandidate = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { jobVacancyId, candidateId } = req.body;

        if (!candidateId) {
            logger.warn(`ID do candidato é obrigatório para adicionar aos favoritos.`);
            return res.status(400).json({ message: 'ID do candidato é obrigatório.' });
        }

        const query = { companyId, jobVacancyId: jobVacancyId || null }; // Define `null` para favoritos gerais
        let jobVacancyFavorites = await JobVacancyFavorites.findOne(query);

        if (!jobVacancyFavorites) {
            jobVacancyFavorites = new JobVacancyFavorites({
                companyId,
                jobVacancyId: jobVacancyId || null,
                favoriteCandidates: [candidateId]
            });
        } else if (jobVacancyFavorites.favoriteCandidates.includes(candidateId)) {
            logger.warn(`Candidato ${candidateId} já nos favoritos para ${jobVacancyId ? `vaga ${jobVacancyId}` : 'favoritos gerais'}.`);
            return res.status(400).json({ message: 'Candidato já está nos favoritos.' });
        } else {
            jobVacancyFavorites.favoriteCandidates.push(candidateId);
        }

        await jobVacancyFavorites.save();
        logger.info(`Candidato ${candidateId} adicionado aos favoritos para ${jobVacancyId ? `vaga ${jobVacancyId}` : 'favoritos gerais'}.`);
        res.status(200).json({ message: 'Candidato adicionado aos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao adicionar candidato aos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao adicionar candidato aos favoritos', error: error.message });
    }
};

// Função para remover um candidato dos favoritos gerais ou de uma vaga específica
exports.removeFavoriteCandidate = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { jobVacancyId, candidateId } = req.body;

        const query = { companyId, jobVacancyId: jobVacancyId || null }; // Define `null` para favoritos gerais
        const jobVacancyFavorites = await JobVacancyFavorites.findOne(query);

        if (!jobVacancyFavorites) {
            logger.warn(`Lista de favoritos não encontrada para ${jobVacancyId ? `vaga ${jobVacancyId}` : 'favoritos gerais'}.`);
            return res.status(404).json({ message: 'Lista de favoritos não encontrada.' });
        }

        const index = jobVacancyFavorites.favoriteCandidates.indexOf(candidateId);
        if (index === -1) {
            logger.warn(`Candidato ${candidateId} não está nos favoritos para ${jobVacancyId ? `vaga ${jobVacancyId}` : 'favoritos gerais'}.`);
            return res.status(400).json({ message: 'Candidato não está nos favoritos.' });
        }

        jobVacancyFavorites.favoriteCandidates.splice(index, 1);
        await jobVacancyFavorites.save();
        logger.info(`Candidato ${candidateId} removido dos favoritos para ${jobVacancyId ? `vaga ${jobVacancyId}` : 'favoritos gerais'}.`);
        res.status(200).json({ message: 'Candidato removido dos favoritos com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao remover candidato dos favoritos: ${error.message}`);
        res.status(500).json({ message: 'Erro ao remover candidato dos favoritos', error: error.message });
    }
};