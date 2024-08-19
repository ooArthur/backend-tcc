const { createLogger, format, transports } = require('winston');
const path = require('path');

// Configuração do logger
const logger = createLogger({
    level: 'info', // Nível mínimo de logs que serão registrados (info, warn, error)
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        // Registra logs de erro em um arquivo separado
        new transports.File({ 
            filename: path.join(__dirname, '../Logs/error.log'), 
            level: 'error' 
        }),
        // Registra todos os logs (info, warn, error) em um arquivo
        new transports.File({ 
            filename: path.join(__dirname, '../Logs/combined.log') 
        }),
    ],
});

// Adiciona um console logger se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(), // Adiciona cores ao log para facilitar a leitura no console
            format.simple() // Formato simples (apenas a mensagem)
        )
    }));
}

module.exports = logger;