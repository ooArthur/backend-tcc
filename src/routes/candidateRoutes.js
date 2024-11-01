const express = require("express");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

// Rota para criar Candidato
router.post("/create-candidate",
    candidateController.createCandidate
);

// Rota para listar Candidatos
router.get("/list-candidates",
    authenticateToken,
    /* authorizeRoles, */
    candidateController.listAllCandidates
);

router.get("/list-candidate",
    authenticateToken,
    candidateController.getCandidateById
);

router.get("/list-candidate/:id",
    authenticateToken,
    candidateController.getCandidateByIdP
);

// Rota para atualizar Candidato
router.put("/update-candidate/:id",
    authenticateToken,
    candidateController.updateCandidateById
);

// Rota para listar as vagas favoritas do Candidato
router.get("/list-favorites",
    authenticateToken,
    candidateController.listFavoriteJobVacancies
);

// Rota para adicionar uma vaga favorita para o Candidato
router.post("/add-favorite",
    authenticateToken,
    authorizeRoles('Admin', 'Candidate'),
    candidateController.addFavoriteJobVacancy
);

// Rota para remover uma vaga favorita do Candidato
router.delete("/remove-favorite",
    authenticateToken,
    candidateController.removeFavoriteJobVacancy
);

router.get("/generate-pdf",
    authenticateToken,
    candidateController.generateStyledResumePDF
);

module.exports = router;