const cron = require('node-cron');
const userController = require('./controllers/userController');
const vacancyController = require('./controllers/vacancyController');

// Executa diariamente à meia-noite
cron.schedule('0 0 * * *', () => {
    // Remove todos os usuarios que nao verificaram a conta 15 dias desde a criação 
    userController.removeUnverifiedUsers();
    // Remove todas as vagas criadas a mais de 3 meses
    vacancyController.removeOldJobVacancies();
});