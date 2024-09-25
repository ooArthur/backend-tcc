const Candidate = require('../models/CandidateProfile'); // Model do candidato
const { getJobRecommendations } = require('../services/RecommendationService');

// Controlador para recomendar vagas
exports.recommendVacancies = async (req, res) => {
    const userId = req.user.id;

    try {
        // Busca o perfil do candidato
        const candidate = await Candidate.findById(userId).populate('candidateExperience');

        if (!candidate) {
            return res.status(404).send({ error: 'Candidato não encontrado.' });
        }

        // Obtém recomendações de vagas
        const recommendations = await getJobRecommendations(candidate);
        
        res.send({ recommendations });
    } catch (error) {
        console.error("Erro ao recomendar vagas:", error);
        res.status(500).send({ error: error.message });
    }
};