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


module.exports = router;