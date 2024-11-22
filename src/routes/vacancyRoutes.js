const { Router } = require('express');
const vacancyController = require('../controllers/vacancyController');

const { vacancyValidationRules } = require('../validators/vacancyValidator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

const router = Router();

// Rota para criar uma vaga
router.post('/create-vacancy',
    authenticateToken, 
    authorizeRoles('Company', 'Admin'),
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
    authenticateToken,
    vacancyController.getJobVacancyById
);

// Rota para deletar Vagas
router.delete('/delete-vacancy/:id',
    authenticateToken,
    authorizeRoles('Company', 'Admin'),
    vacancyController.deleteJobVacancyById
);

// Rota para atualizar Vagas
router.put('/update-vacancy/:id',
    authenticateToken,
    /* authorizeRoles('Company', 'Admin'),
    vacancyValidationRules(),
    validate, */
    /* authorizeUser,  */
    vacancyController.updateJobVacancyById
);

// Rota para listar candidatos interessados em uma vaga
router.get('/list-interested/:id',
    authenticateToken,
    vacancyController.listInterestedCandidates
);

// Rota para adicionar candidatos interessados em uma vaga
router.post('/add-interested',
    authenticateToken,
    vacancyController.addInterestedCandidate
);

// Rota para adicionar interesse em várias vagas
router.post('/add-interested-batch',
    authenticateToken,
    vacancyController.addInterestedBatch
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
    vacancyController.getJobApplicationsAndStatusForCandidate
);

router.post('/vacancy-status/update',
    authenticateToken,
    vacancyController.setJobApplicationStatusByCompany
);

router.get('/vacancies-applied',
    authenticateToken,
    vacancyController.listAppliedVacancies
);

router.get('/applications-today',
    authenticateToken,
    authorizeRoles('Candidate', 'Admin'),
    vacancyController.getDailyApplicationCount
);

router.get('/company-vacancies/',
    authenticateToken,
    authorizeRoles('Company', 'Admin'),
    vacancyController.getJobVacanciesByCompanyId
)

router.get('/company-vacancies/:id',
    authenticateToken,
    authorizeRoles('Candidate', 'Admin'),
    vacancyController.getJobVacanciesByCompanyId2
)

router.get('/admin/candidate-status-counts',
    authenticateToken,
    authorizeRoles('Admin'),
    vacancyController.getCandidateStatusCounts
);

router.get('/candidate-status-counts',
    authenticateToken,
    authorizeRoles('Admin', 'Company'),
    vacancyController.countApplicationsByStatus
);

router.get('/:jobVacancyId/status-count',
    authenticateToken,
    authorizeRoles('Admin', 'Company'),
    vacancyController.getJobApplicationStatusCount
);

router.get('/candidate-details/:jobVacancyId/:candidateId',
    authenticateToken,
    authorizeRoles('Company', 'Admin'),
    vacancyController.viewCandidateDetails
);

module.exports = router;