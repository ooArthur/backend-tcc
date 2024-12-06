const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Company = require('../models/CompanyProfile');
const JobVacancyFavorites = require('../models/JobVacancyFavorites');
const JobVacancy = require('../models/JobVacancy');
const Candidate = require('../models/CandidateProfile');

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

        const telephoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
        if (!telephoneRegex.test(telephone)) {
            return res.status(400).json({ error: 'O telefone da empresa deve seguir o formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.' });
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

exports.recommendCandidates = async (req, res) => {
    try {
        const companyId = req.user.id;

        // Buscar o perfil da empresa
        const company = await Company.findById(companyId);
        if (!company) {
            logger.warn(`Empresa com ID ${companyId} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        // Buscar as vagas da empresa
        const jobVacancies = await JobVacancy.find({ companyId: company._id }).populate({
            path: 'companyId',
            select: 'companyName'
        });

        // Buscar os candidatos que podem estar interessados
        const candidates = await Candidate.find({ areaOfInterest: { $in: jobVacancies.map(vacancy => vacancy.jobArea) } });

        // Função para contar palavras comuns em duas descrições
        const countCommonWords = (str1, str2) => {
            if (!str1 || !str2) return 0; // Verifica se as strings são válidas
            const words1 = str1.toLowerCase().split(/\W+/);
            const words2 = str2.toLowerCase().split(/\W+/);
            const commonWords = words1.filter(word => words2.includes(word));
            return [...new Set(commonWords)].length;  // Retorna a quantidade de palavras comuns únicas
        };

        // Filtrar candidatos que atendem a pelo menos três condições
        const recommendedCandidates = candidates.filter(candidate => {
            let conditionsMet = 0;

            // Comparação de área de interesse
            if (jobVacancies.some(vacancy => vacancy.jobArea === candidate.areaOfInterest)) {
                conditionsMet++;
            }

            // Comparação de qualificações (pelo menos 3 qualificações em comum)
            const matchingQualifications = jobVacancies.some(vacancy =>
                vacancy.desiredSkills.filter(skill => candidate.candidateQualifications.some(q => q.description === skill)).length >= 3
            );
            if (matchingQualifications) conditionsMet++;

            // Comparação de localização (estado e cidade)
            const isLocationMatch = jobVacancies.some(vacancy =>
                vacancy.jobLocation.state.toLowerCase() === candidate.desiredState.toLowerCase() ||
                vacancy.jobLocation.city.toLowerCase() === candidate.desiredCity.toLowerCase()
            );
            if (isLocationMatch) conditionsMet++;

            // Comparação de salário (considerando faixa salarial)
            const salary = candidate.candidateTargetSalary ? candidate.candidateTargetSalary : null;
            const salaryMatch = jobVacancies.some(vacancy => {
                const vacancySalary = vacancy.salary ? parseInt(vacancy.salary) : null;
                return !vacancySalary || (vacancySalary >= (candidate.candidateTargetSalary - 2000) && vacancySalary <= (candidate.candidateTargetSalary + 2000));
            });
            if (salaryMatch) conditionsMet++;

            // Comparação de descrição do candidato com a descrição da vaga (5 palavras em comum)
            const commonWordsCount = jobVacancies.some(vacancy => countCommonWords(candidate.candidateAbout, vacancy.jobDescription) >= 5);
            if (commonWordsCount) conditionsMet++;

            // Comparação de cargo desejado com a descrição da vaga
            const isRoleMatch = jobVacancies.some(vacancy =>
                vacancy.jobDescription.toLowerCase().includes(candidate.desiredRole.toLowerCase())
            );
            if (isRoleMatch) conditionsMet++;

            // Comparação de idiomas do candidato com qualificações e habilidades da vaga
            const matchingIdioms = jobVacancies.some(vacancy =>
                candidate.candidateIdioms.some(idiom => vacancy.requiredQualifications.includes(idiom.name) || vacancy.desiredSkills.includes(idiom.name))
            );
            if (matchingIdioms) conditionsMet++;

            // Verificar se a vaga não exige qualificação/experiência
            const noExperienceRequired = jobVacancies.some(vacancy => !vacancy.requiredQualifications || vacancy.requiredQualifications.length === 0);
            if (noExperienceRequired) conditionsMet++;

            // Retornar candidatos que atendem a pelo menos 3 condições
            return conditionsMet >= 3;
        });

        if (recommendedCandidates.length === 0) {
            logger.info(`Nenhum candidato recomendado para a empresa com ID ${companyId}.`);
            return res.status(200).json({ message: 'Nenhum candidato recomendado no momento.' });
        }

        logger.info(`Candidatos recomendados encontrados para a empresa com ID ${companyId}.`);

        // Retorna os candidatos recomendados
        return res.status(200).json(recommendedCandidates);
    } catch (error) {
        logger.error(`Erro ao recomendar candidatos: ${error.message}`);
        return res.status(500).json({ message: 'Erro ao recomendar candidatos', error: error.message });
    }
};

