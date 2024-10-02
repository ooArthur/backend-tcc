const mongoose = require('mongoose');

const JobApplicationStatusSchema = new mongoose.Schema(
    {
        jobVacancyId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'JobVacancy', 
            required: true 
        },
        candidateId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Candidate', 
            required: true 
        },
        companyId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Company', 
            required: true 
        },
        status: {
            type: String,
            enum: [
                'Currículo Enviado',
                'Em Análise',
                'Aprovado',
                'Dispensado'
            ],
            default: 'Currículo Enviado',
            required: true
        },
        comments: { type: String }, // Comentários adicionais, se houver
    },
    {
        timestamps: true
    }
);

// Criando o índice composto para evitar duplicações de candidaturas para a mesma vaga
JobApplicationStatusSchema.index({ jobVacancyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplicationStatus', JobApplicationStatusSchema);