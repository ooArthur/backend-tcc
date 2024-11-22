const { body } = require('express-validator');

const candidateValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('O email fornecido não é válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('A senha deve ter no mínimo 8 caracteres'),
        body('candidateName')
            .notEmpty()
            .withMessage('O nome do candidato é obrigatório'),
        body('candidatePhone')
            .isLength({ min: 13, max: 13 })
            .withMessage('O telefone do candidato deve ter exatamente 13 caracteres')
            .matches(/^\(\d{2}\) \d{5}-\d{4}$/)
            .withMessage('O telefone deve estar no formato (XX) XXXXX-XXXX'),
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
            .withMessage('A data de nascimento deve ser uma data válida')
            .custom((value) => {
                const birthDate = new Date(value);
                const today = new Date();

                if (birthDate > today) {
                    throw new Error('A data de nascimento não pode ser uma data futura.');
                }

                const ageDifference = today.getFullYear() - birthDate.getFullYear();
                const birthdayPassedThisYear =
                    today.getMonth() > birthDate.getMonth() ||
                    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

                const age = birthdayPassedThisYear ? ageDifference : ageDifference - 1;

                if (age < 14) {
                    throw new Error('O candidato deve ter pelo menos 14 anos.');
                }

                return true;
            }),
        body('candidateGender')
            .isIn(['Masculino', 'Feminino', 'Outro'])
            .withMessage('O gênero fornecido não é válido'),
        body('candidateCEP')
            .matches(/^\d{5}-\d{3}$/)
            .withMessage('O CEP deve estar no formato XXXXX-XXX'),
        body('candidateAddress')
            .notEmpty()
            .withMessage('O endereço do candidato é obrigatório')
    ];
};

module.exports = {
    candidateValidationRules
};
