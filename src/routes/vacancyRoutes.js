const { Router } = require('express');
const vacancyController = require('../controllers/vacancyController');

const { vacancyValidationRules } = require('../validators/vacancyValidator');
const { validate } = require('../middleware/validate');

const router = Router();

// Rota para criar uma vaga
router.post('/create-vacancy', vacancyValidationRules(), validate, vacancyController.createJobVacancy);''

// Rotas para listagem
router.get('/list-vacancies', vacancyController.listAllJobVacancies);
router.get('/list-vacancy/:id', vacancyController.getJobVacancyById);

// Rota para deletar Vagas
router.delete('/delete-vacancy/:id', vacancyController.deleteJobVacancyById);

// Rota para atualizar Vagas
router.put('/update-vacancy/:id', vacancyController.updateJobVacancyById);

// Rota para listar candidatos interessados em uma vaga
router.get('/list-interested/:id', vacancyController.listInterestedCandidates);

// Rota para adicioanr candidatos interessados em uma vaga
router.post('/add-interested', vacancyController.addInterestedCandidate);

// Rota para listar candidatos interessados em uma vaga
router.delete('/remove-interested/:id', vacancyController.removeInterestedCandidate);

module.exports = router;