const { body } = require('express-validator');

const vacancyValidationRules = () => {
    return [
        body('jobTitle')
            .notEmpty()
            .withMessage('O título da vaga é obrigatório'),
        body('jobDescription')
            .notEmpty()
            .withMessage('A descrição da vaga é obrigatória'),
        body('salary')
            .notEmpty()
            .withMessage('O salário é obrigatório'),
        body('jobLocation')
            .notEmpty()
            .withMessage('A localização da vaga é obrigatória'),
        body('workSchedule')
            .notEmpty()
            .withMessage('O horário de trabalho é obrigatório'),
        body('requiredQualifications')
            .notEmpty()
            .withMessage('As qualificações requeridas são obrigatórias'),
        body('employmentType')
            .notEmpty()
            .withMessage('O tipo de emprego é obrigatório'),
        body('applicationDeadline')
            .isDate()
            .withMessage('A data limite para aplicação deve ser uma data válida'),
    ];
};

module.exports = {
    vacancyValidationRules
};