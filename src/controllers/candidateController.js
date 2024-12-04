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

        if (password.length < 8) {
            logger.warn('A senha deve ter no mínimo 8 caracteres.')
            return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
        }

        if (!candidatePhone || !/^\(\d{2}\) \d{5}-\d{4}$/.test(candidatePhone)) {
            logger.warn('O telefone deve estar no formato (XX) XXXXX-XXXX e ter 13 caracteres.');
            return res.status(400).json({ error: 'O telefone deve estar no formato (XX) XXXXX-XXXX e ter 13 caracteres.' });
        }

        const cleanCEP = candidateCEP.replace(/[^\d\-]/g, ''); 
        if (!cleanCEP || !/^\d{5}\d{3}$/.test(cleanCEP)) {
            logger.warn('O CEP deve estar no formato XXXXX-XXX e ter 10 caracteres.');
            return res.status(400).json({ error: 'O CEP deve estar no formato XXXXX-XXX e ter 10 caracteres.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Tentativa de registro com e-mail já existente: ${email}`);
            return res.status(400).json({ error: 'Email já registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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
        logger.error(`Erro ao criar candidato: ${error.message} - Dados: ${JSON.stringify(req.body)}`);
        res.status(500).json({ error: 'Erro ao criar candidato', details: error.message });

        console.log("Conteúdo do req.body recebido:", JSON.stringify(req.body, null, 2));

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
        const id = req.user.id;
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
        let updates = { ...req.body };

        // Verifica se o campo password está presente nas atualizações
        if (updates.password) {
            // Encripta a nova senha
            const hashedPassword = await bcrypt.hash(updates.password, 10);
            updates.password = hashedPassword;
        }

        // Atualiza o candidato no banco de dados pelo ID
        const updatedCandidate = await Candidate.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

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

        // Busca os dados do candidato no banco de dados
        const candidate = await Candidate.findById(id);
        if (!candidate) {
            logger.warn(`Candidato com ID: ${id} não encontrado.`);
            return res.status(404).json({ message: "Candidato não encontrado" });
        }

        // Cria um novo documento PDF
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Configura os cabeçalhos de resposta para download do PDF
        res.setHeader('Content-Disposition', `attachment; filename=${candidate.candidateName || "Candidato"}-curriculo.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        // Envia o PDF para o cliente como uma resposta (streaming)
        doc.pipe(res);

        // ** Estilização do PDF **

        // Cabeçalho com informações do candidato
        const candidateName = candidate.candidateName || "Não Informado";
        const desiredRole = candidate.desiredRole || "Não Informado";
        
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#333333')
            .text(candidateName.toUpperCase(), { align: 'center' });
        doc.fontSize(14).fillColor('#666666')
            .text(`• ${desiredRole.toLowerCase()} •`, { align: 'center' });

        // Linha colorida centralizada abaixo do nome
        const centerX = (doc.page.width - 400) / 2;
        doc.moveTo(centerX, doc.y + 10).lineTo(centerX + 400, doc.y + 10)
            .strokeColor('#d3f1e0').lineWidth(1).stroke();

        // 2. Sobre Mim
        doc.moveDown(0.5);
        addSectionHeader(doc, 'Sobre Mim');
        const aboutText = candidate.candidateAbout || 'Não Informado';
        doc.fontSize(12).fillColor('#333333').text(aboutText, { width: doc.page.width - 100, align: 'left' });

        // 3. Educação
        doc.moveDown(0.5);
        addSectionHeader(doc, 'Educação');
        const educationText = Array.isArray(candidate.candidateCourses) && candidate.candidateCourses.length > 0
            ? candidate.candidateCourses.map(course => {
                const year = course.conclusionYear || "Ano Não Informado";
                const institution = course.institution || "Instituição Não Informada";
                const name = course.name || "Curso Não Informado";
                return `${year} • ${institution} - ${name}`;
            }).join('\n')
            : 'Sem informações de educação.';
        doc.fontSize(12).fillColor('#333333').text(educationText, { width: doc.page.width - 100, align: 'left' });

        // 4. Experiência
        doc.moveDown(0.5);
        addSectionHeader(doc, 'Experiência');
        if (Array.isArray(candidate.candidateExperience) && candidate.candidateExperience.length > 0) {
            candidate.candidateExperience.forEach(exp => {
                const startDate = exp.startDate ? moment(exp.startDate).format('YYYY') : "Data Não Informada";
                const company = exp.company || "Empresa Não Informada";
                const role = exp.role || "Cargo Não Informado";
                const mainActivities = exp.mainActivities ? exp.mainActivities.split('\n') : ["Atividades Não Informadas"];

                doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333')
                    .text(`${startDate} • ${company}`, { continued: true });
                doc.font('Helvetica').text(` - ${role}`);
                doc.fontSize(10).fillColor('#666666').list(mainActivities, { bulletRadius: 2 });
            });
        } else {
            doc.fontSize(12).fillColor('#333333').text("Sem informações de experiência.");
        }

        // 5. Habilidades com qualificações e idiomas
        const skillsYPosition = doc.y + 10;
        doc.moveTo(50, skillsYPosition);
        addSectionHeader(doc, 'Habilidades');

        // Habilidades
        const qualifications = (candidate.candidateQualifications || []).map(qual => ({
            name: qual.description || "Qualificação Não Informada"
        }));

        const idioms = (candidate.candidateIdioms || []).map(idiom => ({
            name: idiom.name || "Idioma Não Informado",
            level: idiom.level || "Nível Não Informado"
        }));

        const startY = doc.y;

        // Renderizar Qualificações na coluna da esquerda
        renderQualifications(doc, qualifications, 50, startY);

        // Renderizar Idiomas na coluna da direita
        renderIdioms(doc, idioms, 320, startY);

        // Adiciona um espaço antes do rodapé de contato
        doc.moveDown(5); // Move para baixo para garantir que o rodapé fique separado

        // Rodapé com Contato centralizado no final da página
        const phone = candidate.candidatePhone || "Telefone não Informado";
        const email = candidate.email || "Email não Informado";
        const link = candidate.candidateLink || "Linkedin não Informado";

        // Posiciona o rodapé próximo ao final da página
        const footerYPosition = doc.page.height - 70; // 50 unidades de distância do final da página
        doc.fontSize(10).fillColor('#333333')
            .text(`${phone} • ${email} • ${link}`, 0, footerYPosition, { align: 'center' });

        // Finalizar o PDF e enviar para o cliente
        doc.end();

        logger.info(`PDF estilizado gerado com sucesso para o candidato com ID: ${id}. Enviando resposta.`);
    } catch (error) {
        logger.error(`Erro ao gerar PDF estilizado para o candidato com ID: ${req.params.id}. Detalhes: ${error.message}`);
        res.status(500).json({ message: 'Erro ao gerar PDF.' });
    }
};

// Funções auxiliares para adicionar seções e renderizar dados
function addSectionHeader(doc, text) {
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333').text(text.toUpperCase(), { underline: true });
    doc.moveDown(1);
}

function renderQualifications(doc, qualifications, xPosition, yPosition) {
    doc.font('Helvetica').fontSize(12).fillColor('#333333');
    if (qualifications.length === 0) {
        doc.text("Sem qualificações informadas", xPosition, yPosition);
    } else {
        qualifications.forEach((qual, index) => {
            doc.text(qual.name, xPosition, yPosition + index * 16);
        });
    }
}

function renderIdioms(doc, idioms, xPosition, yPosition) {
    const skillHeight = 16;
    const barHeight = 8;
    const barMaxWidth = 100;

    if (idioms.length === 0) {
        doc.font('Helvetica').fontSize(12).fillColor('#333333')
            .text("Sem idiomas informados", xPosition, yPosition);
    } else {
        idioms.forEach((idiom, index) => {
            doc.font('Helvetica').fontSize(12).fillColor('#333333')
                .text(idiom.name, xPosition, yPosition + index * skillHeight);

            const levels = { basico: 1, intermediario: 2, avancado: 3, fluente: 4 };
            const barWidth = (barMaxWidth * (levels[idiom.level.toLowerCase()] || 1)) / 4;

            doc.rect(
                xPosition + 120,
                yPosition + index * skillHeight + 4,
                barMaxWidth,
                barHeight
            )
                .fillOpacity(0.2).fillColor('#d3f1e0').fill();

            doc.rect(
                xPosition + 120,
                yPosition + index * skillHeight + 4,
                barWidth,
                barHeight
            )
                .fillOpacity(1).fillColor('#98d9b9').fill();
        });
    }
}