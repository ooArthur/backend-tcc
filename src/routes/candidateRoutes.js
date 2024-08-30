const express = require("express");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeUser } = require('../middleware/authorizeUser');

// Rota para criar Candidato
router.post("/create-candidate",
    candidateController.createCandidate
);

// Rota para listar Candidatos
router.get("/list-candidates",
    /* authenticateToken,*/
    candidateController.listAllCandidates
);
router.get("/list-candidate/:id",
    /* authenticateToken, */
    candidateController.getCandidateById
);

// Rota para atualizar Candidato
router.put("/update-candidate/:id",
    /* authenticateToken,
    authorizeUser, */
    candidateController.updateCandidateById
);

// Rota para listar as vagas favoritas do Candidato
router.get("/list-favorites/:id",
    /* authenticateToken, */
    candidateController.listFavoriteJobVacancies
);

// Rota para adicionar uma vaga favorita para o Candidato
router.post("/add-favorite",
    /* authenticateToken,
    authorizeUser, */
    candidateController.addFavoriteJobVacancy
);

// Rota para remover uma vaga favorita do Candidato
router.delete("/remove-favorite",
    /* authenticateToken,
    authorizeUser, */
    candidateController.removeFavoriteJobVacancy
);

module.exports = router;