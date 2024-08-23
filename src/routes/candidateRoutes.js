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


module.exports = router;