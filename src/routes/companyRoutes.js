const express = require("express");
const vacancyRoutes = require('./vacancyRoutes');
const companyController = require("../controllers/companyController");

const router = express.Router();

const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require("../middleware/authorizeRoles");

router.use("/vacancy", vacancyRoutes);

// Rota para criar empresa
router.post("/create-company",
    companyController.createCompany
);

// Rota para listagem das Empresas
router.get("/list-companies",
    authenticateToken,
    companyController.listAllCompanies
);
router.get("/list-company/:id",
    authenticateToken,
    companyController.getCompanyById2
);
router.get("/list-company",
    authenticateToken,
    companyController.getCompanyById
);

// Rota para atualizar as empresas
router.put("/update-company/:id",
    authenticateToken,
    /* authorizeUser, */
    companyController.updateCompanyById
);

// Rota para listar os candidatos favoritos da Empresa
router.get("/list-favorites",
    authenticateToken,
    companyController.listFavoriteCandidates
);

// Rota para adicionar os candidatos favoritos da Empresa
router.post("/add-favorite",
    authenticateToken,
    authorizeRoles('Company', 'Admin'),
    companyController.addFavoriteCandidate
);

// Rota para remover os candidatos favoritos da Empresa
router.delete("/remove-favorite",
    authenticateToken,
    authorizeRoles('Admin', 'Company'),
    companyController.removeFavoriteCandidate
);

module.exports = router;