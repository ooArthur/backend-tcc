const express = require("express");
const vacancyRoutes = require('./vacancyRoutes');
const companyController = require("../controllers/companyController");

const router = express.Router();

router.use("/vacancy", vacancyRoutes);

// Rota para criar empresa
router.post("/create-company", companyController.createCompany);

// Rota para listagem das Empresas
router.get("/list-companies", companyController.listAllCompanies);
router.get("/list-company/:id", companyController.getCompanyById);

// Rota para atualizar as empresas
router.put("/update-company/:id", companyController.updateCompanyById);

// Rota para listar os candidatos favoritos da Empresa
router.get("/list-favorites/:companyId/:jobVacancyId", companyController.listFavoriteJobVacancies);

// Rota para adicionar os candidatos favoritos da Empresa
router.post("/add-favorites", companyController.addFavoriteCandidate);

// Rota para remover os candidatos favoritos da Empresa
router.delete("/remove-favorites", companyController.removeFavoriteCandidate);

module.exports = router;