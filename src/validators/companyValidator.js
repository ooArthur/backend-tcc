const { body } = require('express-validator');

const companyValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('O email fornecido não é válido'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('A senha deve ter no mínimo 6 caracteres'),
        body('companyName')
            .notEmpty()
            .withMessage('O nome da empresa é obrigatório'),
        body('positionInTheCompany')
            .notEmpty()
            .withMessage('A posição na empresa é obrigatória'),
        body('branchOfActivity')
            .notEmpty()
            .withMessage('O ramo de atividade é obrigatório'),
        body('telephone')
            .notEmpty()
            .withMessage('O telefone da empresa é obrigatório'),
        body('address')
            .notEmpty()
            .withMessage('O endereço da empresa é obrigatório'),
        body('employeerNumber')
            .isInt()
            .withMessage('O número de empregados deve ser um número inteiro'),
    ];
};

module.exports = {
    companyValidationRules
};