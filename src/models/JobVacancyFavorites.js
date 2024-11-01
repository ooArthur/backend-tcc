const mongoose = require('mongoose');

const JobVacancyFavoritesSchema = new mongoose.Schema(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        jobVacancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobVacancy' },
        favoriteCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true }]
    },
    {
        timestamps: true
    }
);

// Definindo um índice composto para garantir que não haja duplicação de vagas e empresas
JobVacancyFavoritesSchema.index({ companyId: 1, jobVacancyId: 1 }, { unique: true });

module.exports = mongoose.model('JobVacancyFavorites', JobVacancyFavoritesSchema);