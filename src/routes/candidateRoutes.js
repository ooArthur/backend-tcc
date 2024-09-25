const express = require("express");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/authorizeAdmin');

// Rota para criar Candidato
router.post("/create-candidate",
    candidateController.createCandidate
);

// Rota para listar Candidatos
router.get("/list-candidates",
    /* authenticateToken,*/
    /* authorizeAdmin, */
    candidateController.listAllCandidates
);
router.get("/list-candidate",
    authenticateToken,
    candidateController.getCandidateById
);

// Rota para atualizar Candidato
router.put("/update-candidate",
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
    candidateController.addFavoriteJobVacancy
);

// Rota para remover uma vaga favorita do Candidato
router.delete("/remove-favorite",
    authenticateToken,
    candidateController.removeFavoriteJobVacancy
);

module.exports = router;