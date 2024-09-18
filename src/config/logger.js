const { createLogger, format, transports } = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file'); // Para rotacionar logs diariamente

// Configuração do logger
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        // Registra logs de erro com rotação diária
        new DailyRotateFile({
            filename: path.join(__dirname, '../Logs/%DATE%-error.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d' // Mantém arquivos de log por 14 dias
        }),
        // Registra todos os logs com rotação diária
        new DailyRotateFile({
            filename: path.join(__dirname, '../Logs/%DATE%-combined.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        }),
    ],
});

// Adiciona um console logger se não estiver em produção
if (process.env.NODE_ENV !== 'produaction') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(), // Adiciona cores ao log para facilitar a leitura no console
            format.simple() // Formato simples (apenas a mensagem)
        )
    }));
}

module.exports = logger;