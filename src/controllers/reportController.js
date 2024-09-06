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
                target: targetDetails, // Inclui todos os detalhes do alvo da denúncia
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
            target: targetDetails, // Inclui todos os detalhes do alvo da denúncia
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
        const { type, targetId, description, reportedBy } = req.body;

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