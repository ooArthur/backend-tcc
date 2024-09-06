require('dotenv').config();
require('./cron');
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const router = require("./routes/router");
const logger = require("./config/logger");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

// Configuração do CORS para permitir cookies
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Logger de IP e Requisição
app.use((req, res, next) => {
    logger.info(`IP: ${req.ip} - ${req.method} ${req.url}`);
    next();
});

connectDB();
app.use("/api", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

app.use((err, req, res, next) => {
    logger.error(`Erro: ${err.message}`);
    res.status(500).json({ error: 'Ocorreu um erro interno.' });
});