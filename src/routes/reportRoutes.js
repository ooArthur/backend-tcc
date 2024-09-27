const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/authorizeAdmin');
const { authorizeUser } = require('../middleware/authorizeUser');

router.post('/create-report',
    authenticateToken,
    /* authorizeUser, */
    reportController.createReport
);
router.delete('/delete-report/:id',
    /* authenticateToken,
    authorizeAdmin, */
    reportController.deleteReport);
router.get('/list-report-by-id/:id',
    /* authenticateToken,
    authorizeAdmin, */
    reportController.getReportById
);
router.get('/list-reports',
    /* authenticateToken,
    authorizeAdmin, */
    reportController.getReports
);

module.exports = router;