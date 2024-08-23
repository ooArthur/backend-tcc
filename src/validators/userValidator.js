const { body } = require('express-validator');

const userValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('O email fornecido não é válido'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('A senha deve ter no mínimo 6 caracteres'),
    ];
};

module.exports = {
    userValidationRules
};