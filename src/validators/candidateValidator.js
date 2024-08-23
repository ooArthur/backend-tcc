const { body } = require('express-validator');

const candidateValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('O email fornecido não é válido'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('A senha deve ter no mínimo 6 caracteres'),
        body('candidateName')
            .notEmpty()
            .withMessage('O nome do candidato é obrigatório'),
        body('candidatePhone')
            .notEmpty()
            .withMessage('O telefone do candidato é obrigatório'),
        body('desiredRole')
            .notEmpty()
            .withMessage('A função desejada é obrigatória'),
        body('desiredState')
            .notEmpty()
            .withMessage('O estado desejado é obrigatório'),
        body('desiredCity')
            .notEmpty()
            .withMessage('A cidade desejada é obrigatória'),
        body('candidateBirth')
            .isDate()
            .withMessage('A data de nascimento deve ser uma data válida'),
        body('candidateGender')
            .isIn(['Masculino', 'Feminino', 'Outro'])
            .withMessage('O gênero fornecido não é válido'),
        body('candidateCEP')
            .notEmpty()
            .withMessage('O CEP do candidato é obrigatório'),
        body('candidateAddress')
            .notEmpty()
            .withMessage('O endereço do candidato é obrigatório')
    ];
};

module.exports = {
    candidateValidationRules
};