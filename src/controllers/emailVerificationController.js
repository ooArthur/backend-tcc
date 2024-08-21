const VerificationCode = require('../models/VerificationCode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const logger = require('../config/logger');

// Configuração do transporte de e-mail com porta 587 (TLS)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

// Função para gerar um código de verificação numérico de 5 dígitos
function generateCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Função para enviar um e-mail com o código de verificação
async function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Seu Código de Verificação',
        text: `Seu código de verificação é ${code}.`
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`E-mail enviado com sucesso para ${email} com o código ${code}`);
    } catch (error) {
        logger.error(`Erro ao enviar e-mail para ${email}: ${error.message}`);
        // Exclui o código de verificação se não conseguir enviar o e-mail
        await VerificationCode.deleteOne({ email, code });
        throw error;
    }
}

// Controlador para criar e enviar um código de verificação
async function requestVerificationCode(req, res) {
    const { email } = req.body;
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60000); // Código expira em 15 minutos

    try {
        // Verifica se já existe um código não verificado para esse e-mail
        const existingRecord = await VerificationCode.findOne({ email, isVerified: false });
        if (existingRecord) {
            logger.warn(`Código de verificação não verificado ainda para o e-mail ${email}`);
            // Exclui o código anterior se não foi verificado
            await VerificationCode.deleteOne({ _id: existingRecord._id });
        }

        const verificationCode = new VerificationCode({
            email,
            code,
            expiresAt
        });

        await verificationCode.save();
        await sendVerificationEmail(email, code);
        res.status(200).json({ message: 'Código de verificação enviado.' });
    } catch (error) {
        logger.error(`Erro ao solicitar código de verificação para ${email}: ${error.message}`);
        res.status(500).json({ message: 'Erro ao enviar código de verificação.', error: error.message });
    }
}

// Controlador para verificar o código de verificação
async function verifyCode(req, res) {
    const { email, code } = req.body;

    try {
        // Verifica se o código possui 5 dígitos e é numérico
        if (!/^\d{5}$/.test(code)) {
            logger.warn(`Código inválido (não numérico ou não possui 5 dígitos) para o e-mail ${email}`);
            throw new Error('Código inválido.');
        }

        const verificationRecord = await VerificationCode.findOne({ email, code });

        if (!verificationRecord) {
            logger.warn(`Código inválido ou não encontrado para o e-mail ${email}`);
            throw new Error('Código inválido ou expirado.');
        }

        if (verificationRecord.isVerified) {
            logger.warn(`Código já foi utilizado para o e-mail ${email}`);
            // Exclui o código já verificado
            await VerificationCode.deleteOne({ _id: verificationRecord._id });
            throw new Error('Código já foi utilizado.');
        }

        if (verificationRecord.expiresAt < new Date()) {
            logger.warn(`Código expirado para o e-mail ${email}`);
            // Exclui o código expirado
            await VerificationCode.deleteOne({ _id: verificationRecord._id });
            throw new Error('Código expirado.');
        }

        verificationRecord.isVerified = true;
        await verificationRecord.save();
        logger.info(`Código verificado com sucesso para o e-mail ${email}`);
        res.status(200).json({ message: 'Código verificado com sucesso.' });
    } catch (error) {
        logger.error(`Erro na verificação do código para o e-mail ${email}: ${error.message}`);
        res.status(400).json({ message: 'Erro na verificação do código.', error: error.message });
    }
}

module.exports = {
    requestVerificationCode,
    verifyCode
};