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
                'Em Análise',
                'Aprovado',
                'Dispensado'
            ],
            default: 'Em Análise',
            required: true
        },
        comments: { type: String },
    },
    {
        timestamps: true
    }
);

JobApplicationStatusSchema.index({ jobVacancyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplicationStatus', JobApplicationStatusSchema);