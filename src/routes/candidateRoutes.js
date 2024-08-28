const express = require("express");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

// Rota para criar Candidato
router.post("/create-candidate", candidateController.createCandidate);

// Rota para listar Candidatos
router.get("/list-candidates", candidateController.listAllCandidates);
router.get("/list-candidate/:id", candidateController.getCandidateById);

// Rota para atualizar Candidato
router.put("/update-candidate/:id", candidateController.updateCandidateById);

// Rota para listar as vagas favoritas do Candidato
router.get("/list-favorites/:id", candidateController.listFavoriteJobVacancies);

// Rota para adicionar uma vaga favorita para o Candidato
router.post("/add-favorite", candidateController.addFavoriteJobVacancy);

// Rota para remover uma vaga favorita do Candidato
router.delete("/remove-favorite", candidateController.removeFavoriteJobVacancy);


module.exports = router;