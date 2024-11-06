const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Candidate = require('../models/CandidateProfile');
const CandidateFavorites = require('../models/CandidateFavorites');
const JobVacancy = require('../models/JobVacancy');
const moment = require('moment');

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
        logger.error(`Erro ao criar candidato: ${error.message}` + "Requisição:" + JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: 'Erro ao criar candidato', details: error.message });

        console.log("Conteúdo do req.body recebido:", JSON.stringify(req.body, null, 2));

// Exemplo de verificação manual de campos obrigatórios
const requiredFields = [
    "candidateName",
    "candidatePhone",
    "desiredRole",
    "desiredState",
    "desiredCity",
    "candidateCEP",
    "candidateAddress.publicPlace",
    "candidateAddress.neighborhood",
    "candidateAddress.city",
    "candidateAddress.state",
    "candidateAddress.number",
    "candidateBirth",
    "candidateGender"
];

const missingFields = requiredFields.filter(field => {
    const [parent, child] = field.split(".");
    return child ? !(req.body[parent] && req.body[parent][child]) : !req.body[field];
});

if (missingFields.length > 0) {
    console.error("Campos obrigatórios ausentes:", missingFields);
    return res.status(400).json({ error: "Campos obrigatórios ausentes", missingFields });
}        
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
        const id  = req.user.id;
       /*  const { id } = req.params; */

        // Busca o candidato no banco de dados pelo ID
        const candidate = await Candidate.findById(id);

        // Se o candidato não for encontrado, retorna um erro 404
        if (!candidate) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Retorna o candidato encontrado como resposta
        logger.info("Candidato encontrado com o id: " + id)
        res.status(200).json(candidate);
    } catch (error) {
        logger.error(`Erro ao buscar candidato pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar candidato', error: error.message });
    }
};

/* Função pra pré vizualização funcionar */
exports.getCandidateByIdP = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o candidato no banco de dados pelo ID
        const candidate = await Candidate.findById(id);

        // Se o candidato não for encontrado, retorna um erro 404
        if (!candidate) {
            logger.warn(`Candidato com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Candidato não encontrado.' });
        }

        // Retorna o candidato encontrado como resposta
        logger.info("Candidato encontrado com o id: " + id)
        res.status(200).json(candidate);
    } catch (error) {
        logger.error(`Erro ao buscar candidato pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar candidato', error: error.message });
    }
};

// Função para atualizar um candidato pelo ID
exports.updateCandidateById = async (req, res) => {
    try {
        const { id } = req.params;
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
        const candidateId = req.user.id; // Obtém o ID do candidato do token ou sessão

        // Verifica se o candidato possui uma lista de favoritos
        const candidateFavorites = await CandidateFavorites.findOne({ candidateId })
            .populate({
                path: 'favoriteJobVacancies',
                populate: {
                    path: 'companyId',
                    select: 'companyName',
                },
            });

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

exports.generateStyledResumePDF = async (req, res) => {
    try {
        const { id } = req.user;

        // Buscando os dados do candidato no banco de dados
        const candidate = await Candidate.findById(id);
        if (!candidate) {
            logger.warn(`Candidato com ID: ${id} não encontrado.`);
            return res.status(404).json({ message: "Candidato não encontrado" });
        }

        // Criar um novo documento PDF
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Configurar cabeçalho da resposta HTTP para download do PDF
        res.setHeader('Content-Disposition', `attachment; filename=${candidate.candidateName}-curriculo.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        // ** ESTILIZAÇÃO DO PDF **

        // 1. Cabeçalho com informações do candidato
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#333333')
            .text(candidate.candidateName.toUpperCase(), { align: 'center' });
        doc.fontSize(14).fillColor('#666666')
            .text(`• ${candidate.desiredRole.toLowerCase()} •`, { align: 'center' });

        // Linha colorida centralizada abaixo do nome
        const centerX = (doc.page.width - 400) / 2;
        doc.moveTo(centerX, doc.y + 10).lineTo(centerX + 400, doc.y + 10)
            .strokeColor('#d3f1e0').lineWidth(1).stroke();

        // 2. Sobre Mim - alinhado ao topo
        doc.moveDown(0.5); // Espaço ajustado antes da seção

        addSectionHeader(doc, 'Sobre Mim');
        const aboutText = candidate.candidateAbout || 'Descrição não fornecida.';
        doc.fontSize(12).fillColor('#333333').text(aboutText, { width: doc.page.width - 100, align: 'left' });

        // 3. Educação - abaixo de "Sobre Mim"
        doc.moveDown(0.5); // Espaço ajustado antes da seção
        addSectionHeader(doc, 'Educação');

        const educationText = Array.isArray(candidate.candidateCourses)
            ? candidate.candidateCourses.map(course => `${course.conclusionYear} • ${course.institution} - ${course.name}`).join('\n')
            : 'Sem informações de educação.';

        doc.fontSize(12).fillColor('#333333').text(educationText, { width: doc.page.width - 100, align: 'left' });

        // 4. Experiência - abaixo de "Educação"
        doc.moveDown(0.5); // Espaço ajustado antes da seção de Experiência
        addSectionHeader(doc, 'Experiência');

        if (Array.isArray(candidate.candidateExperience)) {
            candidate.candidateExperience.forEach(exp => {
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333')
                    .text(`${moment(exp.startDate).format('YYYY')} • ${exp.company}`, { continued: true });
                doc.font('Helvetica').text(` - ${exp.role}`);
                doc.fontSize(10).fillColor('#666666').list(exp.mainActivities.split('\n').map(a => `${a}`), { bulletRadius: 2 });
            });
        }

        // 5. Habilidades com qualificações e idiomas
        const skillsYPosition = doc.y + 10; // Espaço ajustado antes de Habilidades
        doc.moveTo(50, skillsYPosition);
        addSectionHeader(doc, 'Habilidades');

        // Habilidades
        const qualifications = candidate.candidateQualifications.map(qual => ({
            name: qual.description
        }));

        const idioms = candidate.candidateIdioms.map(idiom => ({
            name: idiom.name,
            level: idiom.level
        }));

        // Alinhar a altura de ambas as seções de habilidades
        const startY = doc.y; // Salva a altura inicial para alinhamento

        // Renderizar Qualificações na coluna da esquerda
        renderQualifications(doc, qualifications, 50, startY);

        // Renderizar Idiomas na coluna da direita
        renderIdioms(doc, idioms, 320, startY);

        // 6. Rodapé com Contato - centralizado
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10).fillColor('#666666')
            .text(`${candidate.candidatePhone} • ${candidate.email} • ${candidate.candidateLink}`, { align: 'center' });
        doc.pipe(res);
        doc.end();
        // Finalizar e enviar o PDF como resposta
        logger.info(`PDF estilizado gerado com sucesso para o candidato com ID: ${id}. Enviando resposta.`);

    } catch (error) {
        logger.error(`Erro ao gerar PDF estilizado para o candidato com ID: ${req.params.id}. Detalhes: ${error.message}`);
        res.status(500).json({ message: 'Erro ao gerar PDF.' });
    }
};

// Função para adicionar cabeçalhos de seção com estilo
function addSectionHeader(doc, text) {
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333').text(text.toUpperCase(), { underline: true });
    doc.moveDown(1);
}

// Função para renderizar as qualificações
function renderQualifications(doc, qualifications, xPosition, yPosition) {
    doc.font('Helvetica').fontSize(12).fillColor('#333333');
    qualifications.forEach((qual, index) => {
        doc.text(qual.name, xPosition, yPosition + index * 16); // Espaçamento ajustado entre qualificações
    });
}

// Função para renderizar os idiomas com nível de proficiência
function renderIdioms(doc, idioms, xPosition, yPosition) {
    const skillHeight = 16; // Ajustando o espaçamento para manter os itens próximos
    const barHeight = 8;
    const barMaxWidth = 100;

    idioms.forEach((idiom, index) => {
        doc.font('Helvetica').fontSize(12).fillColor('#333333')
            .text(idiom.name, xPosition, yPosition + index * skillHeight);

        // Mapeando níveis de proficiência
        const levels = { basico: 1, intermediario: 2, avancado: 3, fluente: 4 };
        const barWidth = (barMaxWidth * (levels[idiom.level.toLowerCase()] || 1)) / 4; // Valor padrão 1 se não definido

        // Renderizar a barra da habilidade
        doc.rect(
            xPosition + 120, // Alinhamento da barra ao lado da habilidade
            yPosition + index * skillHeight + 4, // Ajustando a posição da barra
            barMaxWidth, // Largura máxima da barra
            barHeight // Altura da barra
        )
            .fillOpacity(0.2).fillColor('#d3f1e0').fill(); // Barra base (cinza claro)

        doc.rect(
            xPosition + 120,
            yPosition + index * skillHeight + 4,
            barWidth, // Tamanho da barra baseado no nível da habilidade
            barHeight
        )
            .fillOpacity(1).fillColor('#98d9b9').fill(); // Barra preenchida (verde claro)
    });
}