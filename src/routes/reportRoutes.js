const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

router.post('/create-report',
    authenticateToken,
    /* authorizeUser, */
    reportController.createReport
);
router.delete('/delete-report/:id',
    /* authenticateToken,
    authorizeRoles, */
    reportController.deleteReport);
router.get('/list-report-by-id/:id',
    /* authenticateToken,
    authorizeRoles, */
    reportController.getReportById
);
router.get('/list-reports',
    /* authenticateToken,
    authorizeRoles, */
    reportController.getReports
);

module.exports = router;