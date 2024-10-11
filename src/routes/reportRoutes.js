const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

router.post('/create-report',
    authenticateToken,
    reportController.createReport
);
router.delete('/delete-report/:id',
    authenticateToken,
    authorizeRoles('Admin'),
    reportController.deleteReport);
router.get('/list-report-by-id/:id',
    authenticateToken,
    authorizeRoles('Admin'),
    reportController.getReportById
);
router.get('/list-reports',
    authenticateToken,
    authorizeRoles('Admin'),
    reportController.getReports
);
router.post('/warn-user',
    authenticateToken,
    authorizeRoles('Admin'),
    reportController.giveWarning
);
router.get('/warn-overview',
    authenticateToken,
    authorizeRoles('Admin'),
    reportController.getWarningsAndBannedAccounts
);

module.exports = router;