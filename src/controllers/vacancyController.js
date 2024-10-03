const JobVacancy = require('../models/JobVacancy');
const Company = require('../models/CompanyProfile');
const Candidate = require('../models/CandidateProfile');
const JobApplicationStatus = require('../models/JobApplicationStatus');
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
        logger.error(`Erro ao criar a vaga de emprego: ${error.message} - Empresa ID: ${req.body.companyId}`);
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

// Função para adicionar um candidato interessado em uma vaga
exports.addInterestedCandidate = async (req, res) => {
    try {
        const candidateId = req.user.id;
        const { jobVacancyId } = req.body;  // ID do candidato e da vaga no corpo da requisição

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

        // Cria o status de candidatura com o status inicial como "enviado"
        const newApplicationStatus = new JobApplicationStatus({
            candidateId,
            jobVacancyId,
            companyId: jobVacancy.companyId,
            status: 'Currículo Enviado'
        });

        // Salva a aplicação de status no banco de dados
        await newApplicationStatus.save();

        // Salva as atualizações na vaga
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

        // Requisitos do candidato
        const qualifications = candidate.candidateQualifications.map(q => q.description); // Extrair as descrições
        const { desiredRole, candidateTargetSalary, desiredState, areaOfInterest } = candidate;

        // Definir faixa de salário aceitável (flexível até 2000 para baixo)
        const minSalary = candidateTargetSalary - 2000;
        const maxSalary = candidateTargetSalary + 2000;

        // Construir a consulta para buscar vagas recomendadas
        const query = {
            jobArea: areaOfInterest,  // A vaga deve estar na mesma área de interesse do candidato
            $or: [
                // Verifica se as qualificações do candidato estão nas desejadas
                { desiredSkills: { $in: qualifications } },
                // Verifica se a vaga está no estado desejado
                { 'jobLocation.state': desiredState },
                // Verifica se o salário da vaga está dentro da faixa aceitável
                {
                    $or: [
                        { salary: { $gte: minSalary, $lte: maxSalary } },
                        { salary: null } // Aceitar vagas sem informação de salário
                    ]
                }
            ]
        };

        // Buscar vagas que correspondem ao perfil do candidato e populando o nome da empresa
        const jobVacancies = await JobVacancy.find(query).populate({
            path: 'companyId', // O campo que referencia a empresa
            select: 'companyName' // Seleciona apenas o nome da empresa
        });

        // Filtrar vagas que atendem a pelo menos duas condições
        const recommendedJobVacancies = jobVacancies.filter(vacancy => {
            let conditionsMet = 0;

            // Verificar área de interesse (sempre atendido pelo query)
            conditionsMet++;

            // Verificar se as qualificações do candidato estão nas desejadas pela vaga
            if (vacancy.desiredSkills.some(skill => qualifications.includes(skill))) {
                conditionsMet++;
            }

            // Verificar se a vaga está no estado desejado
            if (vacancy.jobLocation.state === desiredState) {
                conditionsMet++;
            }

            // Verificar se o salário da vaga está dentro da faixa aceitável
            const salary = vacancy.salary ? parseInt(vacancy.salary) : null;
            if (!salary || (salary >= minSalary && salary <= maxSalary)) {
                conditionsMet++;
            }

            // Retornar vagas que atendam pelo menos duas condições
            return conditionsMet >= 3;
        });

        if (recommendedJobVacancies.length === 0) {
            logger.info(`Nenhuma vaga recomendada para o candidato com ID ${candidateId}.`);
            return res.status(200).json({ message: 'Nenhuma vaga recomendada no momento.' });
        }

        logger.info(`Vagas recomendadas encontradas para o candidato com ID ${candidateId}.`);

        // Retorna as vagas recomendadas, incluindo o nome da empresa
        res.status(200).json(recommendedJobVacancies);
    } catch (error) {
        logger.error(`Erro ao recomendar vagas: ${error.message}`);
        res.status(500).json({ message: 'Erro ao recomendar vagas', error: error.message });
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