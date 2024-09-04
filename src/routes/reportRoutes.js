const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.post('/create-report', reportController.createReport);
router.delete('/delete-report', reportController.deleteReport);
router.get('/get-report-by-id', reportController.getReportById);
router.get('/get-reports', reportController.getReports);

module.exports = router;