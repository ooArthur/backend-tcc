const mongoose = require('mongoose');

const CandidateFavoritesSchema = new mongoose.Schema(
    {
        candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
        favoriteJobVacancies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobVacancy', required: true }]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CandidateFavorites', CandidateFavoritesSchema);