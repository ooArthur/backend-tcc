const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/sistemacurriculos";

        if (!mongoURL) {
            throw new Error("MONGO_URL não está definida nas variáveis de ambiente");
        }

        await mongoose.connect(mongoURL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });

        logger.info("MongoDB conectado com sucesso!");  // Log de sucesso
    } catch (err) {
        logger.error(`Erro ao conectar ao MongoDB: ${err.message}`);  // Log de erro
        process.exit(1);  // Encerrar a aplicação em caso de falha
    }
}

module.exports = connectDB;