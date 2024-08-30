const express = require("express");
const companyRoutes = require('./companyRoutes');
const candidateRoutes = require('./candidateRoutes');
const userController = require('../controllers/userController');
const { userValidationRules } = require('../validators/userValidator');
const { validate } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/authorizeAdmin');
const { authorizeUser } = require('../middleware/authorizeUser');

const router = express.Router();

router.use('/company', companyRoutes);
router.use('/candidate', candidateRoutes);

// Rotas para Listar Usuários
router.get('/list-users', 
    /* authenticateToken, 
    authorizeAdmin, */
    userController.listAllUsers
);
router.get('/list-user/:id', 
    /* authenticateToken, 
    authorizeAdmin, */
    userController.getUserById
);

// Rotas para Atualizar Usuários
router.put('/update-user/:id',
    /* authenticateToken,
    authorizeUser, */
    userValidationRules(),
    validate,
    userController.updateUserById
);

// Rotas para Deletar Usuários
router.delete('/delete-user/:id',
    /* authenticateToken,
    authorizeUser, */
    userController.deleteUserById
);

module.exports = router;