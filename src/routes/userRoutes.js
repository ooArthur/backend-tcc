const express = require("express");
const companyRoutes = require('./companyRoutes');

const router = express.Router();

router.use('/company', companyRoutes);

module.exports = router;