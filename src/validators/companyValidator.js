const { body } = require('express-validator');

const companyValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('O email fornecido não é válido'),
        body('password')
            .isLength({ min: 8 })  // Corrigi a verificação da senha para 8 caracteres
            .withMessage('A senha deve ter no mínimo 8 caracteres'),
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
            .isLength({ min: 13, max: 13 })
            .withMessage('O telefone da empresa deve ter exatamente 13 caracteres')
            .matches(/^\(\d{2}\) \d{5}-\d{4}$/)
            .withMessage('O telefone da empresa deve estar no formato (XX) XXXXX-XXXX'),
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
