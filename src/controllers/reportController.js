const Report = require('../models/Report');
const JobVacancy = require('../models/JobVacancy');
const Company = require('../models/CompanyProfile');
const Candidate = require('../models/CandidateProfile');
const { subDays } = require('date-fns');
const logger = require('../config/logger');

// Listar todas as denúncias com detalhes completos
exports.getReports = async (req, res) => {
    try {
        // Buscar todas as denúncias e garantir que a população de 'reportedBy' seja feita
        const reports = await Report.find().populate('reportedBy');

        // Verificar se o campo 'reportedBy' existe para cada denúncia
        const detailedReports = await Promise.all(reports.map(async (report) => {
            let targetDetails;

            // Verificar se 'reportedBy' está presente
            if (!report.reportedBy) {
                return {
                    _id: report.id,
                    type: report.type,
                    target: null,
                    reportReason: report.reportReason,
                    description: report.description,
                    reportedBy: null, // Caso não haja 'reportedBy', definir como null
                    createdAt: report.createdAt,
                    updatedAt: report.updatedAt,
                    error: 'Usuário que fez a denúncia não encontrado'
                };
            }

            // Buscar os detalhes com base no tipo de denúncia
            switch (report.type) {
                case 'vacancy':
                    targetDetails = await JobVacancy.findById(report.targetId).exec();
                    break;
                case 'company':
                    targetDetails = await Company.findById(report.targetId).exec();
                    break;
                case 'candidate':
                    targetDetails = await Candidate.findById(report.targetId).exec();
                    break;
                default:
                    return res.status(400).json({ message: 'Tipo de denúncia inválido.' });
            }

            // Verificar se o alvo foi encontrado
            if (!targetDetails) {
                return {
                    _id: report.id,
                    type: report.type,
                    target: null,
                    reportReason: report.reportReason,
                    description: report.description,
                    reportedBy: {
                        id: report.reportedBy._id,
                        email: report.reportedBy.email
                    },
                    createdAt: report.createdAt,
                    updatedAt: report.updatedAt,
                    error: 'Detalhes do alvo não encontrados'
                };
            }

            // Retornar o relatório detalhado
            return {
                _id: report.id,
                type: report.type,
                target: {
                    ...targetDetails._doc,
                    banned: targetDetails.banned,  // Inclui status de banimento
                    warnings: targetDetails.warnings  // Inclui número de avisos
                },
                reportReason: report.reportReason,
                description: report.description,
                reportedBy: {
                    id: report.reportedBy._id,
                    email: report.reportedBy.email
                },
                createdAt: report.createdAt,
                updatedAt: report.updatedAt
            };
        }));

        logger.info('Listagem de denúncias realizada com sucesso.');
        res.status(200).json(detailedReports);
    } catch (error) {
        logger.error(`Erro ao listar denúncias: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar denúncias', error: error.message });
    }
};

// Buscar uma denúncia por ID com detalhes completos
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar a denúncia no banco de dados
        const report = await Report.findById(id).populate('reportedBy');

        // Verificar se a denúncia foi encontrada
        if (!report) {
            return res.status(404).json({ message: 'Denúncia não encontrada.' });
        }

        let targetDetails;

        // Buscar os detalhes com base no tipo
        switch (report.type) {
            case 'vacancy':
                targetDetails = await JobVacancy.findById(report.targetId).exec();
                break;
            case 'company':
                targetDetails = await Company.findById(report.targetId).exec();
                break;
            case 'candidate':
                targetDetails = await Candidate.findById(report.targetId).exec();
                break;
            default:
                return res.status(400).json({ message: 'Tipo de denúncia inválido.' });
        }

        // Retornar o relatório detalhado
        res.status(200).json({
            id: report._id,
            type: report.type,
            target: {
                ...targetDetails._doc,
                banned: targetDetails.banned,  // Inclui status de banimento
                warnings: targetDetails.warnings  // Inclui número de avisos
            },
            reportReason: report.reportReason,
            description: report.description,
            reportedBy: {
                id: report.reportedBy._id,
                email: report.reportedBy.email
            },
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        });
    } catch (error) {
        logger.error(`Erro ao buscar denúncia por ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar denúncia', error: error.message });
    }
};

// Criar uma nova denúncia
exports.createReport = async (req, res) => {
    try {
        const { type, targetId, reportReason, description } = req.body;
        const reportedBy = req.user.id;

        if (!['company', 'candidate', 'vacancy'].includes(type) || !targetId || !reportReason || !description) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios e devem ser válidos.' });
        }

        // Evitar duplicidade de denúncias para o mesmo targetId e tipo
        const existingReport = await Report.findOne({ type, targetId, reportedBy });
        if (existingReport) {
            return res.status(409).json({ message: 'Denúncia já existe para este alvo.' });
        }

        const newReport = new Report({ type, targetId, reportReason, description, reportedBy });
        await newReport.save();
        logger.info(`Denúncia criada com sucesso. Tipo: ${type}, ID do alvo: ${targetId}`);

        res.status(201).json(newReport);
    } catch (error) {
        logger.error(`Erro ao criar denúncia: ${error.message}`);
        res.status(500).json({ message: 'Erro ao criar denúncia', error: error.message });
    }
};

// Deletar uma denúncia por ID
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'ID da denúncia é obrigatório.' });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Denúncia não encontrada.' });
        }

        await Report.findByIdAndDelete(id);
        logger.info(`Denúncia com ID ${id} excluída com sucesso.`);
        res.status(200).json({ message: 'Denúncia excluída com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir denúncia: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir denúncia', error: error.message });
    }
};

// Emitir aviso para Candidato, Empresa ou Vaga
exports.giveWarning = async (req, res) => {
    try {
        const { type, targetId } = req.body; // Removido 'reason'

        // Validar o tipo (empresa, candidato ou vaga)
        if (!['company', 'candidate', 'vacancy'].includes(type)) {
            return res.status(400).json({ message: 'Tipo inválido. Deve ser company, candidate ou vacancy.' });
        }

        let target;
        let reportTargetId = targetId; // ID da denúncia associada, será usado para exclusão
        let jobVacancy = null;

        // Buscar a entidade alvo (empresa, candidato ou vaga)
        if (type === 'company') {
            target = await Company.findById(targetId).exec();
        } else if (type === 'candidate') {
            target = await Candidate.findById(targetId).exec();
        } else if (type === 'vacancy') {
            jobVacancy = await JobVacancy.findById(targetId).exec();
            if (!jobVacancy || !jobVacancy.companyId) {
                return res.status(404).json({ message: 'Vaga ou empresa associada não encontrada.' });
            }
            target = await Company.findById(jobVacancy.companyId).exec();
            reportTargetId = targetId;  // Manter o ID da vaga para exclusão correta da denúncia
        }

        // Verificar se o alvo foi encontrado
        if (!target) {
            return res.status(404).json({ message: `${type === 'vacancy' ? 'Empresa associada à vaga' : type} não encontrada.` });
        }

        // Incrementar o número de avisos sem considerar o motivo
        if (type === 'vacancy') {
            jobVacancy.warnings = jobVacancy.warnings || [];
            jobVacancy.warnings.push({ date: new Date() });

            // Se houver 5 avisos, excluir a vaga e dar um aviso à empresa associada
            if (jobVacancy.warnings.length >= 5) {
                await JobVacancy.findByIdAndDelete(jobVacancy._id);
                logger.info(`Vaga ${jobVacancy._id} foi excluída após 5 avisos.`);

                // Dar um aviso à empresa associada
                target.warnings = (target.warnings || 0) + 1;
            }

            await jobVacancy.save();
        } else {
            // Se o tipo é empresa ou candidato, incrementa diretamente o número de avisos
            target.warnings = (target.warnings || 0) + 1;
        }

        // Se a empresa tiver acumulado 5 avisos, banir e excluir todas as suas vagas
        if (type === 'company' || (type === 'vacancy' && target.warnings >= 5)) {
            if (target.warnings >= 5) {
                target.banned = true;
                await JobVacancy.deleteMany({ companyId: target._id });
                logger.info(`Empresa ${target._id} foi banida e todas as vagas excluídas após 5 avisos.`);
            }
        }

        await target.save();

        // Excluir a denúncia associada após emitir o aviso
        const report = await Report.findOne({
            targetId: reportTargetId,
            type: 'vacancy'  // Se o tipo é 'vacancy', usar 'vacancy' como type
        });
        if (report) {
            await Report.findByIdAndDelete(report._id);
            logger.info(`Denúncia com ID ${report._id} excluída após aviso.`);
        }

        res.status(200).json({ message: `${type === 'vacancy' ? 'Empresa associada à vaga' : type} recebeu um aviso. Total de avisos: ${target.warnings || jobVacancy.warnings.length}` });
    } catch (error) {
        logger.error(`Erro ao emitir aviso: ${error.message}`);
        res.status(500).json({ message: 'Erro ao emitir aviso', error: error.message });
    }
};

// Função para exibir avisos e contas banidas
exports.getWarningsAndBannedAccounts = async (req, res) => {
    try {
        // Contar o número total de avisos e contas banidas de empresas
        const companiesWithWarnings = await Company.aggregate([
            {
                $match: { warnings: { $gte: 1 } }
            },
            {
                $group: {
                    _id: null,
                    totalWarnings: { $sum: "$warnings" }, // Soma o total de avisos
                    bannedCount: { $sum: { $cond: [{ $eq: ["$banned", true] }, 1, 0] } } // Conta as empresas banidas
                }
            }
        ]);

        // Contar o número total de avisos e contas banidas de candidatos
        const candidatesWithWarnings = await Candidate.aggregate([
            {
                $match: { warnings: { $gte: 1 } } // Busca candidatos com ao menos 1 aviso
            },
            {
                $group: {
                    _id: null,
                    totalWarnings: { $sum: "$warnings" }, // Soma o total de avisos
                    bannedCount: { $sum: { $cond: [{ $eq: ["$banned", true] }, 1, 0] } } // Conta os candidatos banidos
                }
            }
        ]);

        // Extrair os resultados
        const companyWarnings = companiesWithWarnings[0] || { totalWarnings: 0, bannedCount: 0 };
        const candidateWarnings = candidatesWithWarnings[0] || { totalWarnings: 0, bannedCount: 0 };

        // Somar avisos e contas banidas de empresas e candidatos
        const totalWarnings = companyWarnings.totalWarnings + candidateWarnings.totalWarnings;
        const totalBanned = companyWarnings.bannedCount + candidateWarnings.bannedCount;

        logger.info('Consulta de avisos e contas banidas realizada com sucesso.');

        // Retornar os dados no formato esperado para o dashboard
        res.status(200).json({
            totalWarnings,
            totalBanned,
            companyWarnings: companyWarnings.totalWarnings,
            candidateWarnings: candidateWarnings.totalWarnings,
            companyBanned: companyWarnings.bannedCount,
            candidateBanned: candidateWarnings.bannedCount
        });
    } catch (error) {
        logger.error(`Erro ao consultar avisos e contas banidas: ${error.message}`);
        res.status(500).json({ message: 'Erro ao consultar avisos e contas banidas', error: error.message });
    }
};

exports.deleteVacancyAndReport = async (req, res) => {
    const vacancyId = req.params.id;

    try {
        // Buscar a vaga pelo ID
        const jobVacancy = await JobVacancy.findById(vacancyId);
        if (!jobVacancy) {
            logger.warn(`Vaga com ID ${vacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }

        // Buscar a denúncia associada à vaga
        const report = await Report.findOne({ targetId: vacancyId, type: 'vacancy' });
        if (!report) {
            logger.warn(`Denúncia para a vaga com ID ${vacancyId} não encontrada.`);
            return res.status(404).json({ message: 'Denúncia não encontrada.' });
        }

        // Excluir a vaga
        await JobVacancy.findByIdAndDelete(vacancyId);
        // Excluir a denúncia
        await Report.findByIdAndDelete(report._id);
        logger.info(`Denúncia com ID ${report._id} excluída com sucesso e Vaga com ID ${vacancyId} excluída com sucesso.`);

        res.status(200).json({ message: 'Vaga e denúncia excluídas com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir vaga e denúncia: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir vaga e denúncia', error: error.message });
    }
};

exports.banUserAndDeleteReport = async (req, res) => {
    const { userId, reportId } = req.params; // O ID do usuário e o ID da denúncia a serem processados

    try {
        let user;

        // Verificar se o usuário é um candidato
        user = await Candidate.findById(userId);
        if (!user) {
            // Se não for candidato, verificar se é uma empresa
            user = await Company.findById(userId);
        }

        // Se o usuário não for encontrado, retornar erro 404
        if (!user) {
            logger.warn(`Usuário com ID ${userId} não encontrado.`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verificar se o usuário já está banido
        if (user.banned) {
            logger.warn(`Usuário com ID ${userId} já está banido.`);
            return res.status(400).json({ message: 'Usuário já está banido.' });
        }

        // Banir o usuário
        user.banned = true;

        // Buscar e excluir apenas a denúncia específica associada
        const report = await Report.findById(reportId);
        if (!report || report.targetId.toString() !== userId) {
            logger.warn(`Denúncia com ID ${reportId} não encontrada ou não corresponde ao usuário ${userId}.`);
            return res.status(404).json({ message: 'Denúncia não encontrada ou não corresponde ao usuário.' });
        }

        await Report.findByIdAndDelete(reportId);
        await user.save();
        logger.info(`Usuário ${userId} foi banido com sucesso. Denúncia com ID ${reportId} excluída com sucesso.`);

        res.status(200).json({ message: 'Usuário banido e denúncia específica excluída com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao banir usuário e excluir denúncia: ${error.message}`);
        res.status(500).json({ message: 'Erro ao banir usuário e excluir denúncia', error: error.message });
    }
};