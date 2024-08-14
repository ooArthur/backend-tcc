const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017";

        if (!mongoURL) {
            throw new Error("MONGO_URL não está definida nas variáveis de ambiente");
        }

        await mongoose.connect(mongoURL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });

        console.log("MongoDB conectado!");
    } catch (err) {
        console.error("Erro ao conectar ao MongoDB", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;