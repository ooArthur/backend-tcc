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
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const yaml = require("js-yaml");
const http = require("http");

const app = express();
const server = http.createServer(app); // Cria o servidor HTTP do Express

// Middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

// Configuração do CORS para permitir cookies
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Logger de IP e Requisição
app.use((req, res, next) => {
    logger.info(`IP: ${req.ip} - ${req.method} ${req.url}`);
    next();
});

// Conectar ao banco de dados
connectDB();

// Carregar o arquivo swagger.yaml da pasta docs
const swaggerDocument = yaml.load(fs.readFileSync('./src/docs/swagger.yaml', 'utf8'));

// Middleware para servir a documentação Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Roteamento da API
app.use("/api", router);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => { // Configura o servidor para escutar em 0.0.0.0
    logger.info(`Server is running on port ${PORT}`);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    logger.error(`Erro: ${err.message}`);
    res.status(500).json({ error: 'Ocorreu um erro interno.' });
});
