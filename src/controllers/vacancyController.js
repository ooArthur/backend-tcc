const mongoose = require('mongoose');
const JobVacancy = require('../models/JobVacancy');
const Company = require('../models/CompanyProfile');
const Candidate = require('../models/CandidateProfile');
const JobApplicationStatus = require('../models/JobApplicationStatus');
const CandidateFavorites = require('../models/CandidateFavorites');
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
            companyId,
            jobArea
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
            applicationDeadline,
            jobArea
        });

        // Salvando no banco de dados
        const savedJobVacancy = await newJobVacancy.save();

        logger.info(`Vaga de emprego criada com sucesso: "${jobTitle}" pela empresa: ${company.companyName} (ID: ${companyId})`);

        // Retornando a resposta com o status 201 (Criado) e a vaga criada
        res.status(201).json(savedJobVacancy);
    } catch (error) {
        logger.error(`Erro ao criar a vaga de emprego: ${error.message} - Empresa ID: ${req.body}`);
        res.status(500).json({ message: 'Erro ao criar a vaga de emprego', error: error.message });
    }
};

// Função para listar todas as vagas
exports.listAllJobVacancies = async (req, res) => {
    try {
        // Busca todas as vagas no banco de dados
        const jobVacancies = await JobVacancy.find().populate('companyId', 'companyName');

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

        // Retorna a vaga encontrada como resposta
        res.status(200).json(jobVacancy);
    } catch (error) {
        logger.error(`Erro ao buscar vaga pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar vaga', error: error.message });
    }
};

// Função de deletar vaga e dados relacionados (status e favoritos)
exports.deleteJobVacancyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Primeiro, buscamos a vaga para garantir que ela existe
        const jobVacancy = await JobVacancy.findById(id);

        if (!jobVacancy) {
            logger.warn(`Vaga com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }

        // Excluindo os status de candidatura relacionados a essa vaga
        const deleteStatusResult = await JobApplicationStatus.deleteMany({ jobVacancyId: id });
        logger.info(`Status de candidaturas excluídos: ${deleteStatusResult.deletedCount}`);

        // Excluindo os favoritos (supondo que exista uma coleção que guarda os favoritos)
        const deleteFavoritesResult = await CandidateFavorites.deleteMany({ jobVacancyId: id });
        logger.info(`Favoritos excluídos: ${deleteFavoritesResult.deletedCount}`);

        // Agora, removemos a vaga
        const deleteVacancyResult = await JobVacancy.findByIdAndDelete(id);

        // Verifica se a vaga foi realmente excluída
        if (!deleteVacancyResult) {
            logger.warn(`Falha ao excluir a vaga com ID ${id}.`);
            return res.status(500).json({ message: 'Erro ao excluir a vaga.' });
        }

        logger.info(`Vaga excluída com sucesso. ID: ${id}`);

        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: 'Vaga e dados relacionados excluídos com sucesso.' });

    } catch (error) {
        logger.error(`Erro ao excluir a vaga e dados relacionados. ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir a vaga e dados relacionados', error: error.message });
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
        const jobVacancyId = req.params.id; // ID da vaga na URL

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

// Função para adicionar UM candidato interessado em uma vaga
exports.addInterestedCandidate = async (req, res) => {
    try {
        const { jobVacancyId } = req.body;  // ID da vaga no corpo da requisição

        // Verifica se a vaga de emprego existe
        const jobVacancy = await JobVacancy.findById(jobVacancyId);
       /*  if (!jobVacancy) {;
            return res.status(404).json({ message: 'Vaga de emprego não encontrada.' });
        } */

        const candidateId = req.user.id;
        
        // Verifica se o candidato existe
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            logger.warn(`Candidato com ID ${candidateId} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Obtém a data de início e fim do dia atual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);  // 00:00:00 de hoje
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);  // 23:59:59 de hoje

        // Verifica quantas candidaturas o candidato já fez hoje
        const dailyApplicationsCount = await JobApplicationStatus.countDocuments({
            candidateId: candidateId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Se o candidato já atingiu o limite de 10 candidaturas no dia, retorna um erro
        if (dailyApplicationsCount >= 10) {
            logger.warn(`Candidato com ID ${candidateId} já atingiu o limite diário de 10 candidaturas.`);
            return res.status(400).json({ message: 'Você atingiu o limite diário de 10 candidaturas.' });
        }

        // Verifica se o candidato já está na lista de interessados
        const isAlreadyInterested = jobVacancy.interestedCandidates.includes(candidateId);
        if (isAlreadyInterested) {
            logger.warn(`Candidato com ID ${candidateId} já está na lista de interessados para a vaga com ID ${jobVacancyId}.`);
            return res.status(400).json({ message: 'Candidato já está na lista de interessados.' });
        }

        // Adiciona o candidato à lista de interessados
        jobVacancy.interestedCandidates.push(candidateId);

        // Cria o status de candidatura com o status inicial como "Currículo Enviado"
        const newApplicationStatus = new JobApplicationStatus({
            candidateId,
            jobVacancyId,
            companyId: jobVacancy.companyId,
            status: 'Em Análise',
        });

        // Salva a aplicação de status no banco de dados
        await newApplicationStatus.save();

        // Salva as atualizações na vaga
        await jobVacancy.save();
        logger.info(`Candidato com ID ${candidateId} adicionado à vaga com ID ${jobVacancyId}.`);

        res.status(200).json({ message: 'Candidato adicionado à vaga com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao adicionar candidato à vaga: ${error.message}`);
       /*  res.status(500).json({ message: 'Erro ao adicionar candidato à vaga', error: error.message }); */
    }
};

// Função para adicionar várias candidaturas de uma vez só
exports.addInterestedBatch = async (req, res) => {
    try {
        const { jobVacancyIds } = req.body;
        const candidateId = req.user.id;

        console.log("IDs de vagas recebidos:", jobVacancyIds);

        const failedApplications = [];

        for (const jobVacancyId of jobVacancyIds) {
            console.log("Buscando vaga com ID:", jobVacancyId);

            const jobVacancy = await JobVacancy.findById(jobVacancyId);

            const isAlreadyInterested = jobVacancy.interestedCandidates.includes(candidateId);

            if (isAlreadyInterested) {
                failedApplications.push({ jobVacancyId, message: 'Candidato já está na lista de interessados.' });
                continue;
            }

            jobVacancy.interestedCandidates.push(candidateId);

            const newApplicationStatus = new JobApplicationStatus({
                candidateId,
                jobVacancyId,
                companyId: jobVacancy.companyId,
                status: 'Em Análise',
            });

            await newApplicationStatus.save();
            await jobVacancy.save();
            console.log(`Candidato ${candidateId} adicionado à vaga ${jobVacancyId}`);
        }

        if (failedApplications.length > 0) {
            return res.status(207).json({
                message: 'Processo concluído com alguns erros.',
                failedApplications
            });
        }

        res.status(200).json({ message: 'Candidaturas enviadas com sucesso.' });
    } catch (error) {
        console.error(`Erro ao adicionar candidatos às vagas: ${error.message}`);
    }
};

// Função para obter a contagem de candidaturas diárias
exports.getDailyApplicationCount = async (req, res) => {
    try {
        const candidateId = req.user.id;

        // Obtém a data de início e fim do dia atual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);  // 00:00:00 de hoje
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);  // 23:59:59 de hoje

        // Verifica quantas candidaturas o candidato já fez hoje
        const dailyApplicationsCount = await JobApplicationStatus.countDocuments({
            candidateId: candidateId,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Retorna a contagem das candidaturas feitas hoje
        res.status(200).json({
            candidateId,
            date: startOfDay.toISOString().split('T')[0],  // Formato YYYY-MM-DD
            dailyApplicationsCount
        });
    } catch (error) {
        logger.error(`Erro ao obter a contagem de candidaturas diárias: ${error.message}`);
        res.status(500).json({ message: 'Erro ao obter a contagem de candidaturas diárias', error: error.message });
    }
};

// Função para remover um candidato interessado de uma vaga
exports.removeInterestedCandidate = async (req, res) => {
    try {
        const { jobVacancyId } = req.body;
        const candidateId = req.user.id;

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

        // Remove o status da candidatura do banco de dados
        await JobApplicationStatus.deleteOne({
            candidateId,
            jobVacancyId
        });

        // Salva as atualizações
        await jobVacancy.save();
        logger.info(`Candidato com ID ${candidateId} removido da vaga com ID ${jobVacancyId}.`);

        res.status(200).json({ message: 'Candidato removido da vaga com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao remover candidato da vaga: ${error.message}`);
        res.status(500).json({ message: 'Erro ao remover candidato da vaga', error: error.message });
    }
};

exports.recommendJobVacancies = async (req, res) => {
    try {
        const candidateId = req.user.id;

        // Buscar o perfil do candidato
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            logger.warn(`Candidato com ID ${candidateId} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Extrair as qualificações e preferências do candidato
        const qualifications = candidate.candidateQualifications.map(q => q.description);
        const { desiredRole, candidateTargetSalary, desiredState, areaOfInterest } = candidate;

        // Definir faixa de salário aceitável (com tolerância de até 2000)
        const minSalary = candidateTargetSalary - 2000;
        const maxSalary = candidateTargetSalary + 2000;

        // Construir a consulta para buscar vagas recomendadas
        const query = {
            jobArea: areaOfInterest, // Vaga deve estar na mesma área de interesse
            $or: [
                { desiredSkills: { $in: qualifications } }, // Qualificações compatíveis
                { 'jobLocation.state': desiredState }, // Estado desejado
                { 
                    $or: [
                        { salary: { $gte: minSalary, $lte: maxSalary } },
                        { salary: null } // Incluir vagas sem salário especificado
                    ]
                }
            ]
        };

        // Buscar vagas e preencher o nome da empresa
        const jobVacancies = await JobVacancy.find(query).populate({
            path: 'companyId',
            select: 'companyName'
        });

        // Filtrar vagas que atendem a pelo menos três das condições
        const recommendedJobVacancies = jobVacancies.filter(vacancy => {
            let conditionsMet = 1; // A área de interesse já é garantida na query

            // Contabilizar qualificações correspondentes
            if (vacancy.desiredSkills.some(skill => qualifications.includes(skill))) {
                conditionsMet++;
            }

            // Contabilizar se o estado da vaga corresponde ao desejado
            if (vacancy.jobLocation?.state === desiredState) {
                conditionsMet++;
            }

            // Contabilizar se o salário está dentro da faixa desejada ou se é indeterminado
            const salary = vacancy.salary ? parseInt(vacancy.salary) : null;
            if (!salary || (salary >= minSalary && salary <= maxSalary)) {
                conditionsMet++;
            }

            // Retornar vagas que atendem pelo menos três condições
            return conditionsMet >= 3;
        });

        if (recommendedJobVacancies.length === 0) {
            logger.info(`Nenhuma vaga recomendada para o candidato com ID ${candidateId}.`);
            return res.status(200).json({ message: 'Nenhuma vaga recomendada no momento.' });
        }

        logger.info(`Vagas recomendadas encontradas para o candidato com ID ${candidateId}.`);

        // Retorna as vagas recomendadas com o nome da empresa
        return res.status(200).json(recommendedJobVacancies);
    } catch (error) {
        logger.error(`Erro ao recomendar vagas: ${error.message}`);
        return res.status(500).json({ message: 'Erro ao recomendar vagas', error: error.message });
    }
};

// Função para listar todas as vagas aplicadas pelo candidato junto com o status da candidatura
exports.getJobApplicationsAndStatusForCandidate = async (req, res) => {
    try {
        const candidateId = req.user.id; // ID do candidato logado

        // Buscar todas as vagas aplicadas pelo candidato
        const appliedVacancies = await JobVacancy.find({
            interestedCandidates: candidateId
        }).populate('companyId', 'companyName')
            .select('jobTitle jobDescription salary jobArea jobLocation');

        if (!appliedVacancies || appliedVacancies.length === 0) {
            return res.status(200).json({ message: 'Nenhuma candidatura encontrada.' });
        }

        // Buscar o status da candidatura para cada vaga
        const applicationsWithStatus = await Promise.all(appliedVacancies.map(async (vacancy) => {
            const applicationStatus = await JobApplicationStatus.findOne({
                candidateId,
                jobVacancyId: vacancy._id
            }).populate('jobVacancyId', 'jobTitle').populate('companyId', 'companyName');

            return {
                vacancy,
                status: applicationStatus ? applicationStatus.status : 'Status não encontrado'
            };
        }));

        res.status(200).json(applicationsWithStatus);
    } catch (error) {
        logger.error(`Erro ao buscar candidaturas e status: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar candidaturas e status', error: error.message });
    }
};

// Função para a empresa atualizar o status da candidatura
exports.setJobApplicationStatusByCompany = async (req, res) => {
    try {
        const companyId = req.user.id;
        const { candidateId, jobVacancyId, status, comments } = req.body;

        const jobVacancy = await JobVacancy.findOne({ _id: jobVacancyId, companyId });
        if (!jobVacancy) {
            logger.warn(`Vaga com ID ${jobVacancyId} não pertence à empresa com ID ${companyId}.`);
            return res.status(404).json({ message: 'Vaga não encontrada para a empresa.' });
        }

        const application = await JobApplicationStatus.findOne({
            candidateId,
            jobVacancyId
        });

        if (!application) {
            logger.warn(`Candidatura para o candidato com ID ${candidateId} e vaga com ID ${jobVacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Candidatura não encontrada.' });
        }

        application.status = status;
        application.comments = comments || application.comments;
        await application.save();

        logger.info(`Status da candidatura atualizado para o candidato com ID ${candidateId} e vaga com ID ${jobVacancyId}. Novo status: ${status}`);

        res.status(200).json(application);
    } catch (error) {
        logger.error(`Erro ao atualizar o status da candidatura: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar o status da candidatura', error: error.message });
    }
};

exports.listAppliedVacancies = async (req, res) => {
    try {
        const candidateId = req.user.id;

        const appliedVacancies = await JobVacancy.find({
            interestedCandidates: candidateId
        }).populate('companyId', 'companyName')
            .select('jobTitle jobDescription salary jobArea jobLocation');

        if (!appliedVacancies || appliedVacancies.length === 0) {
            return res.status(200).json({ message: 'Nenhuma candidatura encontrada.' });
        }

        res.status(200).json(appliedVacancies);
    } catch (error) {
        logger.error(`Erro ao listar candidaturas: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar candidaturas', error: error.message });
    }
};

exports.getJobVacanciesByCompanyId = async (req, res) => {
    const companyId = req.user.id;

    try {
        // Buscar todas as vagas onde o companyId corresponde
        const jobVacancies = await JobVacancy.find({ companyId });

        if (!jobVacancies || jobVacancies.length === 0) {

            logger.warn("Nenhuma vaga encontrada para essa empresa. Id da empresa: " + companyId)

            return res.status(404).json({ message: 'Nenhuma vaga encontrada para essa empresa.' + companyId });
        }

        // Retornar as vagas encontradas
        res.status(200).json(jobVacancies);

        logger.info("Vagas encontradas para empresa: " + companyId);
    } catch (error) {
        console.error('Erro ao buscar as vagas:', error);
        logger.error("Erro ao buscar vagas da empresa: " + companyId)
        res.status(500).json({ message: 'Erro ao buscar as vagas.' });
    }
};

exports.getJobVacanciesByCompanyId2 = async (req, res) => {
    const companyId = req.params.id;

    try {
        // Buscar todas as vagas onde o companyId corresponde
        const jobVacancies = await JobVacancy.find({ companyId: companyId });

        if (!jobVacancies || jobVacancies.length === 0) {
            logger.warn("Nenhuma vaga encontrada para essa empresa. Id da empresa: " + companyId);
            return res.status(404).json({ message: 'Nenhuma vaga encontrada para essa empresa.' + companyId });
        }

        // Retornar as vagas encontradas
        res.status(200).json(jobVacancies);

        logger.info("Vagas encontradas para empresa: " + companyId);
    } catch (error) {
        console.error('Erro ao buscar as vagas:', error);
        logger.error("Erro ao buscar vagas da empresa: " + companyId);
        res.status(500).json({ message: 'Erro ao buscar as vagas.' });
    }
};


// Função para contar candidatos por status no sistema
exports.getCandidateStatusCounts = async (req, res) => {
    try {
        // Contagem de candidatos para cada status
        const approvedCount = await JobApplicationStatus.countDocuments({ status: 'Aprovado' });
        const inAnalysisCount = await JobApplicationStatus.countDocuments({ status: 'Em Análise' });
        const dismissedCount = await JobApplicationStatus.countDocuments({ status: 'Dispensado' });

        // Retorna as contagens como resposta JSON
        res.status(200).json({
            approved: approvedCount,
            inAnalysis: inAnalysisCount,
            dismissed: dismissedCount
        });
    } catch (error) {
        logger.error(`Erro ao contar candidatos por status: ${error.message}`);
        res.status(500).json({ message: 'Erro ao obter contagem de candidatos por status', error: error.message });
    }
};

// Função para contar o número de candidaturas por status para uma empresa
exports.countApplicationsByStatus = async (req, res) => {
    const companyId = req.user.id;

    try {
        // Conta as candidaturas e agrupa pelo campo de status
        const statusCounts = await JobApplicationStatus.aggregate([
            { $match: { companyId: companyId } },  // Filtra para candidaturas da empresa
            { $group: { _id: "$status", count: { $sum: 1 } } } // Agrupa pelo campo status e conta cada um
        ]);

        // Verifica se há dados e retorna a resposta apropriada
        if (statusCounts.length === 0) {
            return res.status(200).json({ message: 'Nenhuma candidatura encontrada para esta empresa.' });
        }

        // Formata o resultado como um objeto com pares de chave-valor
        const formattedStatusCounts = statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json(formattedStatusCounts);

        logger.info(`Contagem de status das candidaturas para a empresa com ID ${companyId} realizada com sucesso.`);
    } catch (error) {
        logger.error(`Erro ao contar status das candidaturas para a empresa com ID ${companyId}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao contar status das candidaturas.', error: error.message });
    }
};

// Função para obter contagem de status das candidaturas para uma vaga específica
exports.getJobApplicationStatusCount = async (req, res) => {
    const {jobVacancyId} = req.params; // ID da vaga vindo da URL
    const companyId = req.user.id; // ID da empresa autenticada, assumindo que está em `req.user.id`

    try {
        // Verificar se a vaga pertence à empresa autenticada
        const jobVacancy = await JobVacancy.findOne({ _id: jobVacancyId, companyId });

        if (!jobVacancy) {
            logger.warn(`Tentativa de acesso não autorizada: Empresa ${companyId} tentou acessar status da vaga ${jobVacancyId}`);
            return res.status(403).json({ message: 'Você não tem permissão para visualizar os status desta vaga.' });
        }

        // Contar as candidaturas por status
        const statusCount = await JobApplicationStatus.aggregate([
            { $match: { jobVacancyId: new mongoose.Types.ObjectId(jobVacancyId) } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } }
        ]);

        // Lista de status possíveis para garantir que todos sejam exibidos, mesmo que a contagem seja zero
        const statuses = ['Em Análise', 'Aprovado', 'Dispensado'];
        const result = statuses.map(status => {
            const found = statusCount.find(item => item.status === status);
            return { status, count: found ? found.count : 0 };
        });

        console.log(result)

        logger.info(`Status das candidaturas obtido para a vaga ${jobVacancyId} da empresa ${companyId}`);

        res.status(200).json(result); // Retornando a contagem de status

    } catch (error) {
        logger.error(`Erro ao obter contagem de status para a vaga ${jobVacancyId}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao obter contagem de status das candidaturas', error: error.message });
    }
};