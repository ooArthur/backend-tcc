const { Router } = require('express');
const vacancyController = require('../controllers/vacancyController');

const { vacancyValidationRules } = require('../validators/vacancyValidator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();

// Rota para criar uma vaga
router.post('/create-vacancy',
    /* authenticateToken, 
    authorizeUser, */
    vacancyValidationRules(),
    validate,
    vacancyController.createJobVacancy
);

// Rotas para listagem
router.get('/list-vacancies',
   authenticateToken,
   vacancyController.listAllJobVacancies
);

router.get('/list-vacancy/:id',
    /* authenticateToken,*/
    vacancyController.getJobVacancyById
);

// Rota para deletar Vagas
router.delete('/delete-vacancy/:id',
    /*  authenticateToken,
     authorizeUser, */
    vacancyController.deleteJobVacancyById
);

// Rota para atualizar Vagas
router.put('/update-vacancy/:id',
    /* authenticateToken,
    authorizeUser,  */
    vacancyController.updateJobVacancyById
);

// Rota para listar candidatos interessados em uma vaga
router.get('/list-interested',
    /* authenticateToken, */
    vacancyController.listInterestedCandidates
);

// Rota para adicioanr candidatos interessados em uma vaga
router.post('/add-interested',
    authenticateToken,
     /*  authorizeUser, */
    vacancyController.addInterestedCandidate
);

// Rota para remover candidatos interessados em uma vaga
router.delete('/remove-interested',
    authenticateToken,
    /* authorizeUser, */
    vacancyController.removeInterestedCandidate
);

router.get('/recommend-jobvacancies',
    authenticateToken,
    vacancyController.recommendJobVacancies
);

router.get('/vacancy-status',
    authenticateToken,
    vacancyController.getJobApplicationStatusForCandidate
);

router.post('/vacancy-status/update',
    authenticateToken,
    vacancyController.setJobApplicationStatusByCompany
);

router.get('/vacancies-applied',
    authenticateToken,
    vacancyController.listAppliedVacancies
);

module.exports = router;