const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Company = require('../models/CompanyProfile');

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
        logger.error(`Erro ao criar empresa: ${error.message}`);
        res.status(500).json({ error: 'Erro ao criar empresa', details: error.message });
    }
};
