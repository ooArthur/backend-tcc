const express = require("express");
const companyRoutes = require('./companyRoutes');
const candidateRoutes = require('./candidateRoutes');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.use('/company', companyRoutes);
router.use('/candidate', candidateRoutes);

router.post('/create-admin',
    /* authenticateToken,
    authorizeRoles, */
    userController.createAdminUser
);

// Rotas para Listar Usuários
router.get('/list-users', 
    /* authenticateToken, 
    authorizeRoles, */
    userController.listAllUsers
);
router.get('/list-user/:id', 
    /* authenticateToken, 
    authorizeRoles, */
    userController.getUserById
);
// Rotas para Atualizar Usuários
router.put('/update-user/:id',
    authenticateToken,
    userController.updateUserById
);
// Rotas para Deletar Usuários
router.delete('/delete-user/:id',
    authenticateToken,
    authorizeRoles('Admin', 'Company', 'Candidate'),
    userController.deleteUserById
);
// Rota para solicitar a redefinição de senha
router.post('/forgot-password',
    userController.requestPasswordReset
);
// Rota para redefinir a senha
router.post('/reset-password',
    userController.resetPassword
);

router.get('/me',
    authenticateToken,
    userController.getUserInfo
);

/* Logs */

// Mudança para o método POST
router.post('/logs', (req, res) => {
    const logDate = req.body.date;
    const logFilePath = path.resolve(__dirname, `../Logs/${logDate}-combined.log`);

    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'Arquivo de log não encontrado.' });
        }
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao ler o arquivo de log.' });
            }
            res.json({ logs: data });
        });
    });
});

module.exports = router;
