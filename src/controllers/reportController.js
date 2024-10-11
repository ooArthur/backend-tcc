const Report = require('../models/Report');
const JobVacancy = require('../models/JobVacancy');
const Company = require('../models/CompanyProfile');
const Candidate = require('../models/CandidateProfile');
const logger = require('../config/logger');

// Listar todas as denúncias com detalhes completos
exports.getReports = async (req, res) => {
    try {
        // Buscar todas as denúncias
        const reports = await Report.find().populate('reportedBy');

        // Populando os detalhes de cada denúncia com base no tipo
        const detailedReports = await Promise.all(reports.map(async (report) => {
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
            return {
                id: report._id,
                type: report.type,
                target: {
                    ...targetDetails._doc,
                    banned: targetDetails.banned,  // Inclui status de banimento
                    warnings: targetDetails.warnings  // Inclui número de avisos
                },
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
        const { type, targetId, description } = req.body;
        const reportedBy = req.user.id;

        // Validação
        if (!type || !targetId || !description || !reportedBy) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        // Criar e salvar a nova denúncia
        const newReport = new Report({
            type,
            targetId,
            description,
            reportedBy
        });

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

// Emitir aviso para Candidato ou Empresa
exports.giveWarning = async (req, res) => {
    try {
        const { type, targetId } = req.body;

        // Validar o tipo (empresa ou candidato)
        if (!['company', 'candidate'].includes(type)) {
            return res.status(400).json({ message: 'Tipo inválido. Deve ser company ou candidate.' });
        }

        let target;

        // Buscar a entidade alvo (empresa ou candidato)
        if (type === 'company') {
            target = await Company.findById(targetId).exec();
        } else if (type === 'candidate') {
            target = await Candidate.findById(targetId).exec();
        }

        // Verificar se o alvo foi encontrado
        if (!target) {
            return res.status(404).json({ message: `${type} não encontrado.` });
        }

        // Incrementar o número de avisos
        target.warnings = (target.warnings || 0) + 1;

        // Se os avisos forem >= 5, banir o alvo
        if (target.warnings >= 5) {
            target.banned = true;  // Marca a conta como banida
            logger.info(`Conta ${targetId} foi banida após 5 avisos.`);
        }

        await target.save(); // Salva as alterações no banco

        res.status(200).json({ message: `${type} recebeu um aviso. Total de avisos: ${target.warnings}` });
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
