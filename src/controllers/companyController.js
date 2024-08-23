const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const User = require('../models/User');
const Company = require('../models/CompanyProfile');

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
        logger.error(`Erro ao criar empresa: ${error.message} - Dados: ${JSON.stringify(req.body)}`);
        res.status(500).json({ error: 'Erro ao criar empresa', details: error.message });
    }
};

// Função para listar todas as empresas
exports.listAllCompanies = async (req, res) => {
    try {
        // Busca todas as empresas no banco de dados
        const companies = await Company.find();

        logger.info(`Lista de empresas retornada com sucesso. Total de empresas: ${companies.length}`);

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
        const { id } = req.params;

        // Busca a empresa no banco de dados pelo ID
        const company = await Company.findById(id);

        // Se a empresa não for encontrada, retorna um erro 404
        if (!company) {
            logger.warn(`Empresa com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        logger.info(`Empresa encontrada com sucesso. ID: ${id}`);

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
        const updates = req.body;

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

// Função para deletar uma empresa pelo ID
exports.deleteCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // Remove a empresa do banco de dados pelo ID
        const result = await Company.findByIdAndDelete(id);

        // Se a empresa não for encontrada, retorna um erro 404
        if (!result) {
            logger.warn(`Empresa com ID ${id} não encontrada.`);
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }

        logger.info(`Empresa excluída com sucesso. ID: ${id}`);

        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: 'Empresa excluída com sucesso.' });
    } catch (error) {
        logger.error(`Erro ao excluir empresa pelo ID: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir empresa', error: error.message });
    }
}