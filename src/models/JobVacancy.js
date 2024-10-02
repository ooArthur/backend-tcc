const mongoose = require('mongoose');

const JobVacancySchema = mongoose.Schema(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        jobTitle: { type: String, required: true },
        jobDescription: { type: String, required: true },
        salary: { type: String },
        jobLocation: {
            city: { type: String, required: true },
            state: { type: String, required: true },
        },
        workSchedule: {
            workingHours: { type: String },
            workingDays: {
                type: [String],
                enum: ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado', 'Domingo'],
                default: ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira']
            }
        },
        requiredQualifications: [{ type: String }],
        desiredSkills: [{ type: String }],
        employmentType: {
            type: String,
            enum: ['CLT', 'PJ', 'Temporário', 'Jovem Aprendiz', 'Estágio'],
            required: true
        },
        applicationDeadline: { type: Date },
        interestedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
        jobArea: {
            type: String,
            enum: [
                'Tecnologia',
                'Saúde',
                'Educação',
                'Finanças',
                'Engenharia',
                'Marketing',
                'Vendas',
                'Recursos Humanos',
                'Administração',
                'Jurídico',
                'Logística',
                'Atendimento ao Cliente',
                'Design',
                'Operações',
                'Construção Civil'
            ],
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const JobVacancy = mongoose.model('JobVacancy', JobVacancySchema);

module.exports = JobVacancy;