const express = require("express");
const companyController = require("../controllers/companyController");

const router = express.Router();

router.post("/create-company", companyController.createCompany);

module.exports = router;