const express = require("express");
const companyRoutes = require('./companyRoutes');
const candidateRoutes = require('./candidateRoutes');

const userController = require('../controllers/userController');

const { userValidationRules } = require('../validators/userValidator');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use('/company', companyRoutes);
router.use('/candidate', candidateRoutes);

// Rotas para Listar Usuários
router.get('/list-users', userController.listAllUsers);
router.get('/list-user/:id', userController.getUserById);

// Rotas para Atualizar Usuários
router.put('/update-user/:id', userValidationRules(), validate, userController.updateUserById);

// Rotas para Deletar Usuários
router.delete('/delete-user/:id', userController.deleteUserById);

module.exports = router;